import { useState } from 'react';
import { X } from 'lucide-react';

const AnnouncementBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20 text-primary py-2 px-4 relative">
      <div className="section-container flex items-center justify-center gap-2 text-sm">
        <span>🍀</span>
        <span className="font-medium">系統升級中，網絡可能會較慢，請耐心等待</span>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/60 hover:text-primary transition-colors"
        aria-label="Close announcement"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AnnouncementBanner;
