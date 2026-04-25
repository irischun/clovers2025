import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { format } from 'date-fns';
import { ImageIcon, Video as VideoIcon, Users, Maximize2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCommunityGallery, type CommunityItem } from '@/hooks/useCommunityPublish';

type CommunityTab = 'images' | 'videos';

const formatDate = (s: string) => {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '—' : format(d, 'yyyy-MM-dd HH:mm');
};

const CommunityGallery = () => {
  const { data: items = [], isLoading, isError } = useCommunityGallery(true);
  const [tab, setTab] = useState<CommunityTab>('images');
  const [selected, setSelected] = useState<CommunityItem | null>(null);

  const images = items.filter((i) => i.media_type === 'image');
  const videos = items.filter((i) => i.media_type === 'video');

  const renderImage = (item: CommunityItem, idx: number) => (
    <div
      key={item.id}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 animate-slide-up"
      style={{ animationDelay: `${idx * 30}ms` }}
    >
      <button
        type="button"
        onClick={() => setSelected(item)}
        className="relative aspect-square overflow-hidden w-full block cursor-zoom-in"
      >
        <img
          src={item.media_url}
          alt={item.title || item.prompt?.substring(0, 50) || 'Community image'}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm inline-flex">
            <Maximize2 className="w-4 h-4 text-muted-foreground" />
          </span>
        </div>
      </button>
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDate(item.created_at)}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">社群</Badge>
        </div>
        {item.prompt && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.prompt}</p>
        )}
      </div>
    </div>
  );

  const renderVideo = (item: CommunityItem, idx: number) => (
    <div
      key={item.id}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 animate-slide-up"
      style={{ animationDelay: `${idx * 30}ms` }}
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <video
          src={item.media_url}
          poster={item.thumbnail_url || undefined}
          controls
          preload="metadata"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDate(item.created_at)}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">社群</Badge>
        </div>
        {item.prompt && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.prompt}</p>
        )}
      </div>
    </div>
  );

  const renderEmpty = (label: string) => (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground mb-2">尚無社群{label}</h3>
      <p className="text-muted-foreground">成為第一位將作品發布到社群的創作者吧</p>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Community Gallery — Clovers AI</title>
        <meta
          name="description"
          content="Browse community-shared AI generated images and videos from Clovers creators."
        />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
              社群畫廊 <span className="text-primary">Community Gallery</span>
            </h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              探索 Clovers 社群成員公開分享的 AI 生成圖片與影片作品。
            </p>
          </header>

          <Tabs value={tab} onValueChange={(v) => setTab(v as CommunityTab)}>
            <TabsList>
              <TabsTrigger value="images" className="gap-2">
                <ImageIcon className="w-4 h-4" /> 圖片 ({images.length})
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-2">
                <VideoIcon className="w-4 h-4" /> 影片 ({videos.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="images" className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : isError ? (
                <p className="text-center text-destructive py-12">載入失敗，請稍後重試</p>
              ) : images.length === 0 ? (
                renderEmpty('圖片')
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map(renderImage)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="videos" className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : isError ? (
                <p className="text-center text-destructive py-12">載入失敗，請稍後重試</p>
              ) : videos.length === 0 ? (
                renderEmpty('影片')
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.map(renderVideo)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>

        <Footer />
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-4xl p-0 bg-background border-border overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{selected?.title || 'Community media'}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="flex flex-col">
              {selected.media_type === 'image' ? (
                <img
                  src={selected.media_url}
                  alt={selected.title || selected.prompt || ''}
                  className="w-full h-auto max-h-[70vh] object-contain bg-muted"
                />
              ) : (
                <video src={selected.media_url} controls className="w-full max-h-[70vh] bg-muted" />
              )}
              <div className="p-5 space-y-2">
                <p className="text-sm text-muted-foreground">{formatDate(selected.created_at)}</p>
                {selected.prompt && (
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {selected.prompt}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CommunityGallery;
