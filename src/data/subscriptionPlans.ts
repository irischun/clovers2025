// Centralized subscription plans data for consistency across the website

export interface MonthlyPlan {
  name: string;
  pointsPerMonth: number;
  price: number;
  period: '月';
  pricePerPoint: number;
  features: string[];
  popular: boolean;
}

export interface YearlyPlan {
  name: string;
  pointsPerMonth: number;
  price: number;
  period: '年';
  monthlyPrice: number;
  originalMonthlyPrice: number;
  savings: number;
  pricePerPoint: number;
  features: string[];
  popular: boolean;
}

export const monthlyPlans: MonthlyPlan[] = [
  {
    name: '輕量版',
    pointsPerMonth: 150,
    price: 90,
    period: '月',
    pricePerPoint: 0.6,
    features: [
      '每月150點數',
      '平均每點 $0.6',
      '適合輕度使用',
      '基本功能支援',
    ],
    popular: false,
  },
  {
    name: '標準版',
    pointsPerMonth: 450,
    price: 200,
    period: '月',
    pricePerPoint: 0.4,
    features: [
      '每月450點數',
      '平均每點 $0.4',
      '適合標準使用',
      '完整功能支援',
      '優先客服',
    ],
    popular: true,
  },
  {
    name: '高級版',
    pointsPerMonth: 1200,
    price: 400,
    period: '月',
    pricePerPoint: 0.33,
    features: [
      '每月1200點數',
      '平均每點 $0.33',
      '適合高級使用',
      '所有功能無限制',
      '專屬客服支援',
      'API 訪問權限',
    ],
    popular: false,
  },
];

export const yearlyPlans: YearlyPlan[] = [
  {
    name: '輕量版',
    pointsPerMonth: 150,
    price: 900,
    period: '年',
    monthlyPrice: 75,
    originalMonthlyPrice: 90,
    savings: 180,
    pricePerPoint: 0.5,
    features: [
      '每月150點數',
      '平均每點 $0.5',
      '適合輕度使用',
      '基本功能支援',
    ],
    popular: false,
  },
  {
    name: '標準版',
    pointsPerMonth: 450,
    price: 1800,
    period: '年',
    monthlyPrice: 150,
    originalMonthlyPrice: 200,
    savings: 600,
    pricePerPoint: 0.33,
    features: [
      '每月450點數',
      '平均每點 $0.33',
      '年費慳 $600',
      '適合標準使用',
      '完整功能支援',
      '優先客服',
    ],
    popular: true,
  },
  {
    name: '高級版',
    pointsPerMonth: 1200,
    price: 4000,
    period: '年',
    monthlyPrice: 333.3,
    originalMonthlyPrice: 400,
    savings: 800,
    pricePerPoint: 0.28,
    features: [
      '每月1200點數',
      '平均每點 $0.28',
      '適合高級使用',
      '所有功能無限制',
      '專屬客服支援',
      'API 訪問權限',
    ],
    popular: false,
  },
];

// Landing page pricing plans (different structure for marketing purposes)
export interface LandingPlan {
  name: string;
  nameEn: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
}

export const landingPlans: LandingPlan[] = [
  {
    name: '輕量版',
    nameEn: 'Lite',
    price: '$90',
    period: '每月',
    description: '適合剛開始的一人創業者',
    features: [
      '每月150點數',
      '平均每點 $0.6',
      '適合輕度使用',
      '基本功能支援',
    ],
    cta: '免費開始',
    popular: false,
  },
  {
    name: '標準版',
    nameEn: 'Standard',
    price: '$200',
    period: '每月',
    description: '適合成長中的一人公司',
    features: [
      '每月450點數',
      '平均每點 $0.4',
      '適合標準使用',
      '完整功能支援',
      '優先客服',
    ],
    cta: '開始試用',
    popular: true,
  },
  {
    name: '高級版',
    nameEn: 'Premium',
    price: '$400',
    period: '每月',
    description: '適合規模化的團隊',
    features: [
      '每月1200點數',
      '平均每點 $0.33',
      '適合高級使用',
      '所有功能無限制',
      '專屬客服支援',
      'API 訪問權限',
    ],
    cta: '聯繫我們',
    popular: false,
  },
];

// Helper to get plan by name
export const getPlanByName = (name: string, billingPeriod: 'monthly' | 'yearly') => {
  const plans = billingPeriod === 'monthly' ? monthlyPlans : yearlyPlans;
  return plans.find(plan => plan.name === name);
};
