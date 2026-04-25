#!/usr/bin/env node
/**
 * Tri-language i18n audit
 * --------------------------------------------------------------
 * Scans src/components, src/pages, src/contexts for:
 *   1. Hardcoded CJK characters in JSX/TSX user-facing strings
 *      (anything that should go through the t() translation system).
 *   2. Missing / extra keys across en, zh-TW, zh-CN translation files.
 *   3. Empty translation values.
 *
 * Exits with code 1 when any issue is found, so it can be wired
 * into CI (e.g. monthly GitHub Actions cron).
 *
 * Run locally:   node scripts/audit-i18n.mjs
 * Verbose mode:  AUDIT_VERBOSE=1 node scripts/audit-i18n.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');

const SCAN_DIRS = ['components', 'pages', 'contexts'];
const TRANSLATION_FILES = {
  en: join(SRC, 'i18n/translations/en.ts'),
  'zh-TW': join(SRC, 'i18n/translations/zh-TW.ts'),
  'zh-CN': join(SRC, 'i18n/translations/zh-CN.ts'),
};

// Files allowed to contain raw Chinese (translation source files,
// the auto-translate helper, the dashboard/publishing pages where
// content is user-generated, prompt template seeds, etc.)
const ALLOWLIST_PATTERNS = [
  /src\/i18n\//,
  /src\/data\/promptTemplates\.ts$/,
  /src\/data\/subscriptionPlans\.ts$/,
  /src\/components\/TranslatedText\.tsx$/,
  /src\/components\/dashboard\//,
  /src\/components\/publishing\//,
  /src\/pages\/dashboard\//,
];

const CJK_RE = /[\u4e00-\u9fff]/;
const STRING_LITERAL_RE = /(['"`])((?:\\.|(?!\1).)*?)\1/g;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|jsx?)$/.test(entry)) out.push(full);
  }
  return out;
}

function isAllowlisted(file) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  return ALLOWLIST_PATTERNS.some((p) => p.test(rel));
}

/**
 * Parse a translations/<lang>.ts file. We use a tolerant regex
 * because the files are simple `const x = { 'key': 'value', ... }`.
 */
function parseTranslationFile(path) {
  const src = readFileSync(path, 'utf8');
  const keys = new Map();
  const entryRe = /^\s*'([^']+)'\s*:\s*(['"`])((?:\\.|(?!\2).)*?)\2\s*,?\s*$/gm;
  let m;
  while ((m = entryRe.exec(src)) !== null) {
    keys.set(m[1], m[3]);
  }
  return keys;
}

function findHardcodedCJK() {
  const issues = [];
  for (const sub of SCAN_DIRS) {
    const dir = join(SRC, sub);
    let files;
    try {
      files = walk(dir);
    } catch {
      continue;
    }
    for (const file of files) {
      if (isAllowlisted(file)) continue;
      const src = readFileSync(file, 'utf8');
      const lines = src.split('\n');
      let inAllowBlock = false;
      lines.forEach((line, idx) => {
        if (/\/\/\s*i18n-allow-block-start/.test(line)) {
          inAllowBlock = true;
          return;
        }
        if (/\/\/\s*i18n-allow-block-end/.test(line)) {
          inAllowBlock = false;
          return;
        }
        if (inAllowBlock) return;
        if (/\/\/\s*i18n-allow/.test(line)) return;

        const trimmed = line.trim();
        if (
          trimmed.startsWith('//') ||
          trimmed.startsWith('*') ||
          trimmed.startsWith('import ') ||
          trimmed.startsWith('from ')
        ) {
          return;
        }
        const literals = line.match(STRING_LITERAL_RE) || [];
        for (const lit of literals) {
          if (CJK_RE.test(lit)) {
            issues.push({
              file: relative(ROOT, file),
              line: idx + 1,
              snippet: trimmed.slice(0, 160),
            });
            break;
          }
        }
        if (
          CJK_RE.test(line) &&
          !literals.some((l) => CJK_RE.test(l)) &&
          /[>][^<>{}]*[\u4e00-\u9fff][^<>{}]*[<]/.test(line)
        ) {
          issues.push({
            file: relative(ROOT, file),
            line: idx + 1,
            snippet: trimmed.slice(0, 160),
          });
        }
      });
    }
  }
  return issues;
}

function checkTranslationKeyParity() {
  const tables = {};
  for (const [lang, path] of Object.entries(TRANSLATION_FILES)) {
    tables[lang] = parseTranslationFile(path);
  }
  const allKeys = new Set();
  for (const t of Object.values(tables)) {
    for (const k of t.keys()) allKeys.add(k);
  }
  const issues = [];
  for (const key of allKeys) {
    for (const lang of Object.keys(tables)) {
      const v = tables[lang].get(key);
      if (v === undefined) {
        issues.push({ type: 'missing', lang, key });
      } else if (v.trim() === '') {
        issues.push({ type: 'empty', lang, key });
      }
    }
  }
  return { issues, tables };
}

/**
 * Cross-language sanity:
 *  - en values should not contain CJK characters.
 *  - zh-TW & zh-CN values should not be identical to the en value
 *    AND devoid of any CJK (suggests a missed translation).
 */
function checkLanguagePurity(tables) {
  const issues = [];
  for (const [key, enVal] of tables.en) {
    if (CJK_RE.test(enVal)) {
      issues.push({ type: 'en-contains-cjk', key, value: enVal });
    }
    for (const lang of ['zh-TW', 'zh-CN']) {
      const v = tables[lang].get(key);
      if (!v) continue;
      if (!CJK_RE.test(v) && /[a-zA-Z]/.test(v) && v === enVal && v.length > 3) {
        // Likely an English string left in a Chinese file.
        // Allow short brand/code values like "FAQ", "RSS", "AI".
        if (!/^[A-Z0-9 ./-]+$/.test(v)) {
          issues.push({ type: `${lang}-looks-english`, key, value: v });
        }
      }
    }
  }
  return issues;
}

// ─────────────────────────────────────────────────────────────
function main() {
  const verbose = process.env.AUDIT_VERBOSE === '1';
  let failed = false;

  console.log('🌐 i18n audit — Clovers tri-language coverage\n');

  // 1. Hardcoded CJK in components/pages
  const hardcoded = findHardcodedCJK();
  if (hardcoded.length === 0) {
    console.log('✅ No hardcoded CJK strings found in scanned components/pages.');
  } else {
    failed = true;
    console.log(`❌ Found ${hardcoded.length} hardcoded CJK string(s) outside the i18n system:\n`);
    for (const h of hardcoded) {
      console.log(`   ${h.file}:${h.line}`);
      console.log(`     → ${h.snippet}`);
    }
  }

  // 2. Translation key parity & empty values
  const { issues: parityIssues, tables } = checkTranslationKeyParity();
  if (parityIssues.length === 0) {
    console.log(`\n✅ All ${tables.en.size} keys present and non-empty across en / zh-TW / zh-CN.`);
  } else {
    failed = true;
    console.log(`\n❌ ${parityIssues.length} translation parity issue(s):`);
    for (const p of parityIssues.slice(0, 50)) {
      console.log(`   [${p.type}] ${p.lang}  →  ${p.key}`);
    }
    if (parityIssues.length > 50) console.log(`   …and ${parityIssues.length - 50} more.`);
  }

  // 3. Language purity
  const purity = checkLanguagePurity(tables);
  if (purity.length === 0) {
    console.log('\n✅ Language purity OK (en has no CJK, zh files look localized).');
  } else {
    failed = true;
    console.log(`\n⚠️  ${purity.length} purity warning(s):`);
    for (const p of purity.slice(0, 30)) {
      console.log(`   [${p.type}] ${p.key}  →  "${p.value}"`);
    }
    if (purity.length > 30) console.log(`   …and ${purity.length - 30} more.`);
  }

  if (verbose) {
    console.log('\nKey counts:');
    for (const [lang, t] of Object.entries(tables)) console.log(`   ${lang}: ${t.size}`);
  }

  console.log('');
  if (failed) {
    console.log('❌ i18n audit FAILED. Please address the issues above.');
    process.exit(1);
  } else {
    console.log('✅ i18n audit PASSED.');
  }
}

main();
