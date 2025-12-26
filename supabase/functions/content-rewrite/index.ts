import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stylePrompts: Record<string, string> = {
  'xiaohongshu': `你是一位專業的小紅書內容創作者。請用小紅書的風格改寫內容：
- 使用吸引人的標題和emoji
- 分段清晰，每段不超過3-4行
- 加入適當的標籤 #hashtag
- 語氣親切、有感染力
- 結尾加入互動話語如"你們覺得呢？"`,

  'jinyong': `你是金庸武俠小說的風格大師。請用金庸武俠小說的風格改寫內容：
- 使用古典武俠文風
- 加入江湖俠義元素
- 使用四字成語和古詩詞
- 營造武俠世界的氛圍
- 人物對話要有古風韻味`,

  'disney': `你是迪士尼故事創作者。請用迪士尼的風格改寫內容：
- 充滿童趣和夢幻感
- 正向積極的情感基調
- 加入想像力豐富的描述
- 強調友誼、愛和勇氣
- 結尾帶有啟發性的訊息`,

  'laogao': `你是老高風格的說書人。請用老高（老高與小茉）的風格改寫內容：
- 以神秘且引人入勝的方式開場
- 使用"其實..."、"你可能不知道..."等開場白
- 加入驚人的轉折和懸念
- 用通俗易懂的語言解釋複雜概念
- 偶爾加入幽默元素`,

  'aida': `使用AIDA模型（注意力-興趣-渴望-行動）改寫內容：
- Attention（注意力）：用強力的開場抓住讀者
- Interest（興趣）：提供有價值的信息激發興趣
- Desire（渴望）：強調好處和價值，激發渴望
- Action（行動）：清晰的行動呼籲`,

  'pas': `使用PAS結構（問題-煽動-解決方案）改寫內容：
- Problem（問題）：明確指出讀者面臨的問題
- Agitate（煽動）：放大問題的痛點和影響
- Solution（解決方案）：提供有效的解決方案`,

  'fab': `使用FAB框架（特點-優勢-好處）改寫內容：
- Features（特點）：描述產品或概念的特點
- Advantages（優勢）：解釋這些特點帶來的優勢
- Benefits（好處）：強調對讀者的實際好處`,

  '4p': `使用4P模型（圖畫-承諾-證明-推動）改寫內容：
- Picture（圖畫）：描繪理想的未來場景
- Promise（承諾）：做出明確的承諾
- Prove（證明）：提供證據支持承諾
- Push（推動）：推動讀者採取行動`,

  'before-after-bridge': `使用Before-After-Bridge（前後對比法）改寫內容：
- Before（之前）：描述當前的問題狀態
- After（之後）：展示改變後的理想狀態
- Bridge（橋樑）：說明如何從當前到理想狀態`,

  'heros-journey': `使用英雄之旅（經典故事結構）改寫內容：
- 普通世界：介紹主角的日常生活
- 冒險召喚：面臨挑戰或機會
- 跨越門檻：做出決定踏上旅程
- 試煉與成長：面對困難並成長
- 回歸與轉變：帶著新的認知回歸`,

  'three-acts': `使用三幕劇（設定-對抗-解決）改寫內容：
- 第一幕（設定）：介紹背景和主題
- 第二幕（對抗）：展開核心衝突和發展
- 第三幕（解決）：達到高潮並解決問題`,

  'sensory-immersion': `使用感官沉浸法（細節描繪情感連結）改寫內容：
- 視覺：生動的畫面描寫
- 聽覺：聲音和對話的呈現
- 觸覺：質感和體感的描述
- 情感：深入的情緒刻畫
- 場景：營造身臨其境的氛圍`,
};

const languageMap: Record<string, string> = {
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  'en': 'English',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      url, 
      outputLanguage = 'zh-TW', 
      style, 
      customStyle,
      targetWordCount,
      geoOptimized = false,
      customEnding = false,
      customEndingText = '',
      isBatch = false,
      urls = []
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // For batch processing, process multiple URLs
    const urlsToProcess = isBatch ? urls : [url];
    const results: Array<{ url: string; content: string; status: string }> = [];

    for (const targetUrl of urlsToProcess) {
      if (!targetUrl || !targetUrl.trim()) continue;

      try {
        // Build the rewrite prompt
        let stylePrompt = '';
        if (style === 'custom' && customStyle) {
          stylePrompt = `請按照以下自訂風格改寫內容：\n${customStyle}`;
        } else if (style && stylePrompts[style]) {
          stylePrompt = stylePrompts[style];
        } else {
          stylePrompt = '請以專業、清晰的方式改寫內容，保持原意的同時優化表達。';
        }

        let prompt = `請根據以下URL的內容進行改寫。如果是YouTube連結，請分析影片內容；如果是網頁連結，請分析網頁內容。

URL: ${targetUrl}

輸出語言：${languageMap[outputLanguage] || '繁體中文'}

改寫風格：
${stylePrompt}`;

        if (targetWordCount && targetWordCount > 0) {
          prompt += `\n\n目標字數：約 ${targetWordCount} 字`;
        }

        if (geoOptimized) {
          prompt += `\n\n請將內容轉換為GEO優化格式：
- 使用清晰的標題結構（H1, H2, H3）
- 加入適當的關鍵詞
- 優化段落結構和可讀性
- 加入內部連結建議
- 優化meta描述`;
        }

        if (customEnding && customEndingText) {
          prompt += `\n\n請在文章結尾加入以下內容：\n${customEndingText}`;
        }

        console.log('Processing URL:', targetUrl);
        console.log('Style:', style);

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { 
                role: 'system', 
                content: `你是一位專業的內容改寫專家。你能夠分析網頁和YouTube影片的內容，並根據指定的風格和要求進行高質量的改寫。

重要提示：
1. 如果收到YouTube連結，請基於影片標題、描述和內容進行改寫
2. 如果收到網頁連結，請基於網頁的主要內容進行改寫
3. 保持內容的核心訊息，但根據指定風格調整表達方式
4. 確保輸出內容原創、有價值且符合目標語言的表達習慣`
              },
              { role: 'user', content: prompt }
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI gateway error:', response.status, errorText);
          
          if (response.status === 429) {
            results.push({ url: targetUrl, content: '', status: 'rate_limited' });
            continue;
          }
          if (response.status === 402) {
            results.push({ url: targetUrl, content: '', status: 'credits_exhausted' });
            continue;
          }
          results.push({ url: targetUrl, content: '', status: 'error' });
          continue;
        }

        const data = await response.json();
        const rewrittenContent = data.choices?.[0]?.message?.content || '';
        
        results.push({ url: targetUrl, content: rewrittenContent, status: 'success' });
        console.log('Successfully processed:', targetUrl);

      } catch (urlError) {
        console.error('Error processing URL:', targetUrl, urlError);
        results.push({ url: targetUrl, content: '', status: 'error' });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: isBatch ? results : results[0],
        isBatch 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Content rewrite error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
