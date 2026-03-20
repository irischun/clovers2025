import { useLanguage } from '@/i18n/LanguageContext';

/**
 * Returns translated plan names, features, descriptions, and CTAs
 * based on the user's chosen language.
 */
export function useTranslatedPlans() {
  const { t } = useLanguage();

  const planNameMap: Record<string, string> = {
    '輕量版': t('plan.lite'),
    '標準版': t('plan.standard'),
    '高級版': t('plan.premium'),
  };

  const planEnMap: Record<string, string> = {
    'Lite': t('plan.liteEn'),
    'Standard': t('plan.standardEn'),
    'Premium': t('plan.premiumEn'),
  };

  const planDescMap: Record<string, string> = {
    '適合剛開始的一人創業者': t('plan.liteDesc'),
    '適合成長中的一人公司': t('plan.standardDesc'),
    '適合規模化的團隊': t('plan.premiumDesc'),
  };

  const planCtaMap: Record<string, string> = {
    '免費開始': t('plan.liteCta'),
    '開始試用': t('plan.standardCta'),
    '聯繫我們': t('plan.premiumCta'),
  };

  const featureMap: Record<string, string> = {
    '每月150點數': t('plan.pointsPerMonth', { points: '150' }),
    '每月450點數': t('plan.pointsPerMonth', { points: '450' }),
    '每月1200點數': t('plan.pointsPerMonth', { points: '1200' }),
    '平均每點 $0.6': t('plan.avgPerPoint', { price: '0.6' }),
    '平均每點 $0.5': t('plan.avgPerPoint', { price: '0.5' }),
    '平均每點 $0.4': t('plan.avgPerPoint', { price: '0.4' }),
    '平均每點 $0.33': t('plan.avgPerPoint', { price: '0.33' }),
    '平均每點 $0.28': t('plan.avgPerPoint', { price: '0.28' }),
    '適合輕度使用': t('plan.suitLight'),
    '適合標準使用': t('plan.suitStandard'),
    '適合高級使用': t('plan.suitHeavy'),
    '基本功能支援': t('plan.basicSupport'),
    '完整功能支援': t('plan.fullSupport'),
    '優先客服': t('plan.prioritySupport'),
    '所有功能無限制': t('plan.unlimitedFeatures'),
    '專屬客服支援': t('plan.dedicatedSupport'),
    'API 訪問權限': t('plan.apiAccess'),
    '年費慳 $600': t('plan.annualSave', { amount: '600' }),
    '年費慳 $800': t('plan.annualSave', { amount: '800' }),
    '年費慳 $180': t('plan.annualSave', { amount: '180' }),
  };

  const translatePlanName = (name: string) => planNameMap[name] || name;
  const translatePlanEn = (nameEn: string) => planEnMap[nameEn] || nameEn;
  const translateDescription = (desc: string) => planDescMap[desc] || desc;
  const translateCta = (cta: string) => planCtaMap[cta] || cta;
  const translateFeature = (feature: string) => featureMap[feature] || feature;
  const translatePeriod = (period: string) => {
    if (period === '月') return t('plan.period.month').replace('/', '');
    if (period === '年') return t('plan.period.year').replace('/', '');
    if (period === '每月') return t('sub.perMonth');
    return period;
  };

  return {
    translatePlanName,
    translatePlanEn,
    translateDescription,
    translateCta,
    translateFeature,
    translatePeriod,
    t,
  };
}
