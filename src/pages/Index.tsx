import { Helmet } from 'react-helmet-async';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import GalleriesSection from '@/components/GalleriesSection';
import PricingSection from '@/components/PricingSection';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';
import ContactButton from '@/components/ContactButton';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Clover - 一站式營銷AI生成系統</title>
        <meta name="description" content="Clover 一站式營銷AI生成系統 - 省時、省人力、不中斷的內容產出系統。再也不需要在多個工具之間來回奔波。" />
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
