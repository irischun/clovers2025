import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, Mail } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const FAQSection = () => {
  const { t } = useLanguage();

  const faqs = [
    { question: t('faq.q1'), answer: t('faq.a1') },
    { question: t('faq.q2'), answer: t('faq.a2') },
    { question: t('faq.q3'), answer: t('faq.a3') },
    { question: t('faq.q4'), answer: t('faq.a4') },
    { question: t('faq.q5'), answer: t('faq.a5') },
    { question: t('faq.q6'), answer: t('faq.a6') },
    { question: t('faq.q7'), answer: t('faq.a7') },
    { question: t('faq.q8'), answer: t('faq.a8') },
  ];

  return (
    <section id="faq" className="py-24 sm:py-32 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute top-40 right-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-40 left-10 w-64 h-64 rounded-full bg-seedling/5 blur-3xl" />
      
      <div className="section-container relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="badge-nature mb-6 inline-flex">
            <HelpCircle className="w-4 h-4" />
            <span>{t('faq.badge')}</span>
          </div>
          <h2 className="heading-display text-4xl sm:text-5xl lg:text-6xl mb-6">{t('faq.title')}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('faq.subtitle')}</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="card-elevated overflow-hidden border-none px-0">
                <AccordionTrigger className="text-left text-base font-heading font-semibold hover:no-underline px-6 py-5 hover:text-primary transition-colors duration-300 [&[data-state=open]]:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground px-6 pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-secondary/50 border border-border/50">
            <Mail className="w-5 h-5 text-primary" />
            <p className="text-muted-foreground">
              {t('faq.contactPrompt')}{' '}
              <a href="mailto:support@clovers.app" className="text-primary hover:text-primary/80 font-medium transition-colors duration-300">
                {t('faq.contactUs')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
