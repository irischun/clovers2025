import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: '什麼是 Clover？',
    answer:
      'Clover 是一個專為一人公司和獨立創業者設計的 AI 驅動工作平台。它整合了提示詞管理、內容排程、媒體庫和 AI 生成工具，讓您可以在一個地方完成所有內容創作工作。',
  },
  {
    question: '我需要技術背景才能使用嗎？',
    answer:
      '完全不需要！Clover 設計得非常直觀易用。我們的介面簡潔明瞭，即使是技術新手也能快速上手。如果遇到任何問題，我們的支援團隊隨時為您服務。',
  },
  {
    question: 'AI 生成的內容品質如何？',
    answer:
      'Clover 使用最先進的 AI 模型，能夠生成高品質、符合語境的內容。您可以根據自己的品牌調性自訂提示詞，確保生成的內容符合您的需求。所有內容都可以在發布前編輯和調整。',
  },
  {
    question: '可以取消訂閱嗎？',
    answer:
      '當然可以！您可以隨時取消訂閱，沒有任何長期合約或取消費用。取消後，您仍可使用服務直到當期結束。所有資料都可以在取消前匯出。',
  },
  {
    question: '支援哪些社交媒體平台？',
    answer:
      '目前 Clover 支援 Instagram、YouTube、Twitter/X 和 LinkedIn 的內容排程。我們持續增加更多平台支援，包括 TikTok、Facebook 和 Pinterest。',
  },
  {
    question: '我的資料安全嗎？',
    answer:
      '資料安全是我們的首要任務。所有資料都經過加密存儲，我們遵循業界最佳安全實踐。我們不會將您的資料用於訓練 AI 模型或與第三方分享。',
  },
  {
    question: '免費版有什麼限制？',
    answer:
      '免費版包含基本功能：10 個提示詞模板、每月 5 次 AI 生成、基本排程功能和 100 MB 媒體儲存。對於剛開始的創業者來說，這足以體驗 Clover 的核心價值。',
  },
  {
    question: '如何升級到付費方案？',
    answer:
      '您可以隨時從設定頁面升級。升級立即生效，我們會按比例計算當月費用。所有付費方案都提供 14 天退款保證。',
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            常見問題
          </span>
          <h2 className="heading-display text-4xl md:text-5xl mb-6">
            您可能想知道的
          </h2>
          <p className="text-lg text-muted-foreground">
            找不到答案？歡迎聯繫我們的支援團隊，我們很樂意幫助您。
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-primary/50"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            還有其他問題？{' '}
            <a
              href="mailto:support@clover.app"
              className="text-primary hover:underline font-medium"
            >
              聯繫我們
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
