import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
}

interface GalleryProps {
  title: string;
  subtitle: string;
  items: GalleryItem[];
}

const GallerySection = ({ title, subtitle, items }: GalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  return (
    <section className="py-16 border-t border-border/50">
      <div className="section-container">
        {/* Section header */}
        <div className="mb-10">
          <h3 className="heading-display text-2xl mb-2">{title}</h3>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>

        {/* Gallery grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="group cursor-pointer overflow-hidden rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => setSelectedImage(item)}
            >
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Overlay with title */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {item.title}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-2 bg-background border-border">
          {selectedImage && (
            <div className="space-y-3">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.title}
                className="w-full h-auto rounded-lg"
              />
              <p className="text-center text-foreground font-medium px-4 pb-2">
                {selectedImage.title}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

// Manga gallery data
const mangaItems: GalleryItem[] = [
  { id: 'manga-1', title: '老散投資日記 - 點解刷新十次都仲係跌', imageUrl: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=400&fit=crop' },
  { id: 'manga-2', title: '乒壇奇聞是與非 - 好人好者打粒粒', imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop' },
  { id: 'manga-3', title: '老散投資日記 - 炒股日常', imageUrl: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&h=400&fit=crop' },
  { id: 'manga-4', title: '倒數31日最後一搏', imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=400&fit=crop' },
  { id: 'manga-5', title: '乒壇是與非 - 球技咁夠科技搭救', imageUrl: 'https://images.unsplash.com/photo-1614583225154-5fcdda07019e?w=400&h=400&fit=crop' },
];

// Cover images data
const coverItems: GalleryItem[] = [
  { id: 'cover-1', title: 'Nano Banana Pro - 谷歌全新AI生成模型', imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=400&fit=crop' },
  { id: 'cover-2', title: 'Clover一人公司 - 雙子塔檸檬角色', imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=400&fit=crop' },
  { id: 'cover-3', title: '未來出行 - 智能電動車系列', imageUrl: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=400&h=400&fit=crop' },
  { id: 'cover-4', title: 'AI實戰工作坊 - 一人公司武器庫', imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop' },
  { id: 'cover-5', title: 'Nano Banana Pro - 爆炸網絡熱潮', imageUrl: 'https://images.unsplash.com/photo-1676299081847-5c0c7bdf3e3f?w=400&h=400&fit=crop' },
];

// Product images data
const productItems: GalleryItem[] = [
  { id: 'product-1', title: '產品攝影 - 彩色糖果威士忌', imageUrl: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&h=400&fit=crop' },
  { id: 'product-2', title: '產品攝影 - 威士忌展示', imageUrl: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop' },
  { id: 'product-3', title: '3D角色 - 咖啡廳兔子', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop' },
  { id: 'product-4', title: '產品攝影 - iPhone展示', imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop' },
  { id: 'product-5', title: '產品攝影 - 方便麵推廣', imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=400&fit=crop' },
];

const GalleriesSection = () => {
  return (
    <section className="py-24 bg-card">
      <GallerySection
        title="漫畫生成案例"
        subtitle="查看AI生成的專業漫畫作品集"
        items={mangaItems}
      />
      <GallerySection
        title="封面圖生成案例"
        subtitle="查看AI生成的專業封面圖作品集"
        items={coverItems}
      />
      <GallerySection
        title="產品圖片生成案例"
        subtitle="查看AI生成的專業產品攝影作品集"
        items={productItems}
      />
    </section>
  );
};

export default GalleriesSection;
