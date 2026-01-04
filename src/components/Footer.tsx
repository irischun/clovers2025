import { Facebook, Instagram, Linkedin, Twitter, Youtube, Mail, ArrowUp, Leaf, Heart } from 'lucide-react';

const Footer = () => {
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

  return (
    <footer className="relative bg-background pt-20 pb-8 overflow-hidden">
      {/* Top border gradient */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-primary/3 blur-3xl" />
      <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-seedling/3 blur-3xl" />
      
      <div className="section-container relative z-10">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-seedling flex items-center justify-center shadow-lg shadow-primary/25">
                <Leaf className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display text-2xl text-foreground">
                Clover
              </span>
            </div>
            
            <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
              From a single seedling to a field of clover, nurtured on one united platform.
              <br />
              一站式營銷AI生成系統
            </p>
            
            {/* Social links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="social-icon"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
          
          {/* Quick links */}
          <div>
            <h4 className="font-heading font-bold text-foreground mb-6">快速連結</h4>
            <ul className="space-y-4">
              {['功能', '定價', 'FAQ', '聯繫我們'].map((link) => (
                <li key={link}>
                  <a 
                    href={`#${link === '功能' ? 'features' : link === '定價' ? 'pricing' : link === 'FAQ' ? 'faq' : 'contact'}`}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-foreground mb-6">聯繫方式</h4>
            <div className="space-y-4">
              <a 
                href="mailto:hello@clover.com" 
                className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors duration-300"
              >
                <Mail className="w-5 h-5" />
                <span>hello@clover.com</span>
              </a>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div className="divider-organic mb-8" />
        
        {/* Bottom section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            © {new Date().getFullYear()} Clover. Made with 
            <Heart className="w-4 h-4 text-primary fill-primary" /> 
            for creators.
          </p>
        </div>
      </div>

      {/* Back to top button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-br from-primary to-seedling text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-110 transition-all duration-300 z-50 group"
        aria-label="Back to top"
      >
        <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-300" />
      </button>
    </footer>
  );
};

export default Footer;