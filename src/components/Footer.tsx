import { Facebook, Instagram, Linkedin, Twitter, Youtube, Mail, ArrowUp, Heart } from 'lucide-react';
import cloversLogo from '@/assets/clovers-logo-icon.jpeg';
import { APP_VERSION } from '@/config/version';
import { useLanguage } from '@/i18n/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  const quickLinks = [
    { label: t('footer.features'), href: '#features' },
    { label: t('footer.pricing'), href: '#pricing' },
    { label: t('nav.faq'), href: '#faq' },
    { label: t('footer.contactUs'), href: '#contact' },
  ];

  return (
    <footer className="relative bg-background pt-20 pb-8 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-primary/3 blur-3xl" />
      <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-accent/3 blur-3xl" />
      
      <div className="section-container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img src={cloversLogo} alt="Clovers AI Logo" className="w-12 h-12 object-contain rounded-lg" />
              <span className="font-heading text-xl font-bold text-foreground uppercase">
                Clovers <span className="text-primary">AI</span>
              </span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
              {t('footer.description')}
              <br />{t('footer.zhDescription')}
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} className="social-icon" aria-label={social.label}>
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-heading font-bold text-foreground mb-6 uppercase tracking-widest text-sm">{t('footer.quickLinks')}</h4>
            <ul className="space-y-4">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-muted-foreground hover:text-primary transition-colors duration-300">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading font-bold text-foreground mb-6 uppercase tracking-widest text-sm">{t('footer.contactMethod')}</h4>
            <div className="space-y-4">
              <a href="mailto:hello@clover.com" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors duration-300">
                <Mail className="w-5 h-5" /><span>hello@clover.com</span>
              </a>
            </div>
          </div>
        </div>
        
        <div className="divider-organic mb-8" />
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            © {new Date().getFullYear()} Clovers AI. Made with
            <Heart className="w-4 h-4 text-primary fill-primary" /> {t('footer.forCreators')}
          </p>
          <p className="text-xs text-muted-foreground/60">v{APP_VERSION}</p>
        </div>
      </div>

      <button onClick={scrollToTop}
        className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-110 transition-all duration-300 z-50 group"
        aria-label="Back to top">
        <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-300" />
      </button>
    </footer>
  );
};

export default Footer;
