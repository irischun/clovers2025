import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/dashboard/DashboardHome";
import PromptsPage from "./pages/dashboard/PromptsPage";
import SchedulerPage from "./pages/dashboard/SchedulerPage";
import MediaPage from "./pages/dashboard/MediaPage";
import AIToolsPage from "./pages/dashboard/AIToolsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import ImageGenerationPage from "./pages/dashboard/ImageGenerationPage";
import VoiceGenerationPage from "./pages/dashboard/VoiceGenerationPage";
import SpeechToTextPage from "./pages/dashboard/SpeechToTextPage";
import VideoGenerationPage from "./pages/dashboard/VideoGenerationPage";
import VideoGeneration2Page from "./pages/dashboard/VideoGeneration2Page";
import LipSyncPage from "./pages/dashboard/LipSyncPage";
import YouTubeSearchPage from "./pages/dashboard/YouTubeSearchPage";
import XiaohongshuSearchPage from "./pages/dashboard/XiaohongshuSearchPage";
import RSSPage from "./pages/dashboard/RSSPage";
import ContentOrganizePage from "./pages/dashboard/ContentOrganizePage";
import StickerMakerPage from "./pages/dashboard/StickerMakerPage";
import SmartPublishPage from "./pages/dashboard/SmartPublishPage";
import GalleryPage from "./pages/dashboard/GalleryPage";
import SubscriptionPage from "./pages/dashboard/SubscriptionPage";
import BuyPointsPage from "./pages/dashboard/BuyPointsPage";
import PointHistoryPage from "./pages/dashboard/PointHistoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />}>
              <Route index element={<DashboardHome />} />
              <Route path="prompts" element={<PromptsPage />} />
              <Route path="scheduler" element={<SchedulerPage />} />
              <Route path="media" element={<MediaPage />} />
              <Route path="ai-tools" element={<AIToolsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="image-generation" element={<ImageGenerationPage />} />
              <Route path="voice-generation" element={<VoiceGenerationPage />} />
              <Route path="speech-to-text" element={<SpeechToTextPage />} />
              <Route path="video-generation" element={<VideoGenerationPage />} />
              <Route path="video-generation-2" element={<VideoGeneration2Page />} />
              <Route path="lip-sync" element={<LipSyncPage />} />
              <Route path="youtube-search" element={<YouTubeSearchPage />} />
              <Route path="xiaohongshu-search" element={<XiaohongshuSearchPage />} />
              <Route path="rss" element={<RSSPage />} />
              <Route path="content-organize" element={<ContentOrganizePage />} />
              <Route path="sticker-maker" element={<StickerMakerPage />} />
              <Route path="smart-publish" element={<SmartPublishPage />} />
              <Route path="gallery" element={<GalleryPage />} />
              <Route path="subscription" element={<SubscriptionPage />} />
              <Route path="buy-points" element={<BuyPointsPage />} />
              <Route path="point-history" element={<PointHistoryPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
