import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import cloverMascot from '@/assets/clover-mascot.png';

const HeroSection = () => {
  const navigate = useNavigate();
  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="section-container relative z-10 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="animate-slide-up">
            <h1 className="heading-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl mb-4">
              <span className="text-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Clover</span>
            </h1>
            
            <p className="text-base sm:text-lg text-muted-foreground/80 mb-6 font-light tracking-wide max-w-md">
              From a single seedling to a field of clover, nurtured on one united platform
            </p>

            <div className="space-y-1 mb-6">
              <p className="text-2xl sm:text-3xl text-primary font-bold tracking-tight">
                一站式營銷AI生成系統
              </p>
              
              <p className="text-lg sm:text-xl text-foreground/90 font-medium">
                省時、省人力、不中斷的內容產出系統
              </p>

              <p className="text-base text-muted-foreground">
                再也不需要在多個工具之間來回奔波
              </p>
            </div>

            <Button className="btn-primary text-lg px-8 py-6 mb-10 group shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300" onClick={() => navigate('/auth')}>
              <span>來播種你的靈感 Start Now</span>
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Button>

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
              <a
                href="#"
                className="social-icon"
                aria-label="Threads"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.068V12c.015-3.63.908-6.537 2.657-8.64C5.966 1.378 8.73.12 12.186.096h.014c2.648.018 4.886.758 6.65 2.2 1.693 1.385 2.888 3.402 3.55 5.996l-2.098.506c-1.077-4.239-4.01-6.246-8.102-6.217-2.766.021-4.91.98-6.373 2.853-1.378 1.765-2.07 4.206-2.057 7.258v.067c.014 3.13.696 5.58 2.026 7.28 1.395 1.782 3.522 2.714 6.32 2.766 2.373-.044 4.259-.73 5.608-2.042 1.264-1.228 1.903-2.866 1.903-4.87 0-1.503-.373-2.665-1.11-3.454-.634-.678-1.521-1.07-2.636-1.166-.21 1.694-.867 3.02-1.95 3.94-1.12.95-2.578 1.432-4.333 1.432-1.427 0-2.636-.39-3.594-1.16-.992-.797-1.495-1.867-1.495-3.18 0-1.407.565-2.552 1.68-3.406 1.062-.812 2.472-1.241 4.194-1.276.814-.017 1.713.044 2.684.18l.077.012v-.836c0-1.14-.243-1.97-.723-2.466-.459-.475-1.156-.716-2.072-.716h-.044c-1.654.026-2.74.831-3.228 2.395l-2.023-.574c.683-2.35 2.565-3.733 5.275-3.771h.052c1.556 0 2.816.454 3.745 1.35.951.918 1.434 2.222 1.434 3.879v1.626c.72.185 1.348.472 1.878.86 1.028.755 1.55 1.862 1.55 3.29v.038c-.006 1.03-.225 1.948-.651 2.73-.42.77-.995 1.42-1.71 1.931-1.458 1.043-3.334 1.573-5.576 1.573zm-1.099-9.514c-1.207.021-2.12.268-2.717.737-.517.405-.78.942-.78 1.594 0 .627.22 1.106.654 1.424.49.359 1.197.541 2.1.541 1.224 0 2.196-.31 2.888-.922.67-.593 1.035-1.447 1.085-2.538-.986-.175-2.02-.298-3.23-.298v-.538z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Right content - Mascot */}
          <div className="relative flex justify-center lg:justify-end animate-slide-in-right">
            <div className="relative">
              <img
                src={cloverMascot}
                alt="Clover mascot"
                className="w-80 lg:w-[450px] animate-float drop-shadow-2xl"
              />
              {/* Glow effect behind mascot */}
              <div className="absolute inset-0 -z-10 blur-3xl bg-primary/20 rounded-full scale-75" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
