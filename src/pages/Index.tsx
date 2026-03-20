import { Helmet } from 'react-helmet-async';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import GalleriesSection from '@/components/GalleriesSection';
import PricingSection from '@/components/PricingSection';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';
import ContactButton from '@/components/ContactButton';
import { useLanguage } from '@/i18n/LanguageContext';

const Index = () => {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t('seo.title')}</title>
        <meta name="description" content={t('seo.description')} />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <AnnouncementBanner />
        <Navigation />
        <HeroSection />
        <GalleriesSection />
        <PricingSection />
        <FAQSection />
        <Footer />
        <ContactButton />
      </div>
    </>
  );
};

export default Index;
