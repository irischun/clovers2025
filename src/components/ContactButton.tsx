import { MessageCircle } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const ContactButton = () => {
  const { t } = useLanguage();
  const whatsappNumber = '85212345678';
  const whatsappMessage = encodeURIComponent(t('contact.message'));
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-8 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50 group"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="absolute right-full mr-3 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
        {t('contact.tooltip')}
      </span>
    </a>
  );
};

export default ContactButton;
