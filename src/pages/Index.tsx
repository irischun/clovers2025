import { Helmet } from 'react-helmet-async';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import ShowcasesSection from '@/components/ShowcasesSection';
import GalleriesSection from '@/components/GalleriesSection';
import PricingSection from '@/components/PricingSection';
import FAQSection from '@/components/FAQSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';
import ContactButton from '@/components/ContactButton';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Clover - AI 一人公司武器庫</title>
        <meta name="description" content="Clover turns scattered tools into a clean single, intelligent workspace. AI-powered toolkit for solopreneurs." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <AnnouncementBanner />
        <Navigation />
        <HeroSection />
        <ShowcasesSection />
        <GalleriesSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
        <Footer />
        <ContactButton />
      </div>
    </>
  );
};

export default Index;
