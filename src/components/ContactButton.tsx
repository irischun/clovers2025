import { MessageCircle } from 'lucide-react';

const ContactButton = () => {
  const whatsappNumber = '85212345678'; // Replace with actual WhatsApp number
  const whatsappMessage = encodeURIComponent('你好！我對 Clovers 有興趣，想了解更多。');
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
      
      {/* Tooltip */}
      <span className="absolute right-full mr-3 px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
        WhatsApp 聯繫我們
      </span>
    </a>
  );
};

export default ContactButton;
