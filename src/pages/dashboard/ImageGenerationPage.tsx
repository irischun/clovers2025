import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PointsBalanceCard from '@/components/dashboard/PointsBalanceCard';
import { useUserPoints } from '@/hooks/useUserPoints';
import { useGeneratedImages } from '@/hooks/useGeneratedImages';
import { Image, Loader2, Download, Wand2, Camera, Film, Palette, ShoppingBag, Share2, ChevronDown, ChevronUp, Sparkles, Upload, X, Languages, Shirt, Zap, ImagePlus, Type, Grid3X3, User, Star, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

// Camera angle presets - comprehensive list from reference
const cameraAngles = [
  { id: 'medium-half-eye', label: '中景半身平視鏡頭', prompt: 'medium shot, half-body, eye level view' },
  { id: 'closeup-look-camera', label: '特寫鏡頭望向鏡頭', prompt: 'close-up shot, looking at camera' },
  { id: 'jungle-atv-action', label: '叢林騎沙灘車動作鏡頭', prompt: 'jungle ATV action shot, dynamic movement' },
  { id: 'shoulder-bat', label: '肩扛棒球棒', prompt: 'shoulder carrying baseball bat, confident pose' },
  { id: 'junkyard-closeup', label: '廢車場特寫', prompt: 'junkyard closeup, gritty environment' },
  { id: 'desert-reach', label: '沙漠伸手特寫', prompt: 'desert reaching hand close-up, dramatic' },
  { id: 'front-fullbody', label: '正面全身鏡頭', prompt: 'front full body shot' },
  { id: 'half-camera-view', label: '半身攝影機視圖', prompt: 'half body camera view' },
  { id: 'low-angle-action', label: '低角度動態動作', prompt: 'low angle dynamic action shot' },
  { id: 'medium-shot', label: '中景鏡頭', prompt: 'medium shot' },
  { id: 'angry-expression', label: '憤怒表情', prompt: 'angry expression, intense emotion' },
  { id: 'high-angle-overhead', label: '高角度俯視', prompt: 'high angle overhead shot' },
  { id: 'rotating-shot', label: '旋轉鏡頭', prompt: 'rotating camera shot' },
  { id: 'rotate-other-side', label: '旋轉展示另一侧', prompt: 'rotating to show other side' },
  { id: 'show-other-side', label: '顯示另一側', prompt: 'showing the other side' },
  { id: 'extreme-closeup', label: '特寫鏡頭', prompt: 'extreme close-up shot' },
  { id: 'over-shoulder-behind', label: '背後越肩鏡頭', prompt: 'over the shoulder shot from behind' },
  { id: 'dialogue-ots', label: '對話過肩鏡頭', prompt: 'dialogue over the shoulder shot' },
  { id: 'ots-face-focus', label: '過肩聚焦臉部', prompt: 'over the shoulder focus on face' },
  { id: 'side-profile-sky', label: '側臉望天空', prompt: 'side profile looking at sky' },
  { id: 'elbow-lean-camera', label: '靠手肘望鏡頭', prompt: 'leaning on elbow looking at camera' },
  { id: 'drone-overhead', label: '無人機俯視鏡頭', prompt: 'drone overhead shot, aerial view' },
  { id: 'extreme-low-angry', label: '極低角度憤怒', prompt: 'extreme low angle, angry expression' },
  { id: 'extreme-high-look', label: '極高角度望鏡頭', prompt: 'extreme high angle looking at camera' },
  { id: 'extreme-closeup-eyes', label: '極端特寫眼睛', prompt: 'extreme close-up on eyes' },
  { id: 'extreme-wide', label: '極端廣角鏡頭', prompt: 'extreme wide angle shot' },
  { id: 'subject-right', label: '主角位於右側', prompt: 'subject positioned on the right side' },
];

// Style tags organized by category
const styleTags = {
  basic: {
    label: '基本選項',
    tags: [
      { id: 'none', label: '無', description: '不使用任何風格標籤' },
    ]
  },
  photography: {
    label: '攝影風格',
    tags: [
      { id: 'professional-photo', label: '專業攝影', description: '商業級專業攝影效果' },
      { id: 'natural-light', label: '自然光照', description: '柔和自然光線' },
      { id: 'dramatic-lighting', label: '戲劇化光影', description: '強烈明暗對比' },
      { id: 'product-closeup', label: '產品特寫', description: '細節突出的近距離拍攝' },
    ]
  },
  artistic: {
    label: '藝術風格',
    tags: [
      { id: 'watercolor', label: '水彩畫', description: '柔和水彩藝術風格' },
      { id: 'manga', label: '漫畫風格', description: '日式動漫繪畫風格' },
      { id: 'sticker', label: '貼紙風格', description: '可愛貼紙設計風格' },
      { id: 'oil-painting', label: '油畫質感', description: '經典油畫藝術效果' },
      { id: 'pixar', label: 'PIXAR Style', description: '皮克斯動畫電影風格' },
      { id: 'ghibli', label: '吉卜力', description: '宮崎駿經典動畫風格' },
      { id: 'american-cartoon', label: '美國卡通', description: '美式卡通動畫風格' },
      { id: 'clay', label: 'Clay Style', description: '黏土定格動畫風格' },
    ]
  },
  render3d: {
    label: '3D渲染',
    tags: [
      { id: '3d-render', label: '3D Render', description: '專業3D渲染效果' },
      { id: 'unreal-engine', label: 'Unreal Engine', description: '虛幻引擎渲染風格' },
    ]
  },
  scene: {
    label: '場景氛圍',
    tags: [
      { id: 'indoor', label: '室內場景', description: '溫馨室內環境' },
      { id: 'outdoor', label: '戶外環境', description: '自然戶外場景' },
      { id: 'futuristic', label: '未來科技', description: '科技未來感設計' },
      { id: 'vintage', label: '復古風格', description: '懷舊復古氛圍' },
    ]
  },
  color: {
    label: '色彩調性',
    tags: [
      { id: 'warm-tone', label: '溫暖色調', description: '暖色系溫馨感覺' },
      { id: 'cool-tone', label: '冷色調', description: '藍調冷色清新效果' },
      { id: 'high-contrast', label: '高對比', description: '強烈明暗對比' },
      { id: 'minimalist', label: '極簡主義', description: '簡潔純淨設計' },
    ]
  },
  social: {
    label: '社交媒體',
    tags: [
      { id: 'whatsapp-sticker', label: 'WhatsApp Sticker', description: '可愛貼紙設計，透明背景' },
      { id: 'youtube-cover', label: 'YouTube Cover', description: 'YouTube高點擊標題設計' },
    ]
  },
};

// Poster style categories - comprehensive list
const posterCategories = {
  creative: {
    label: '創意設計',
    subCategories: {
      poster: {
        label: '海報設計',
        styles: [
          { id: 'magazine-retro', label: '雜誌封面×復古報紙', prompt: 'vintage magazine cover with retro newspaper elements' },
          { id: 'retro-80s-90s', label: '80-90年代復古報紙', prompt: '1980s 1990s retro newspaper style, vintage typography' },
          { id: 'business-magazine', label: '高端商業評論雜誌', prompt: 'high-end business magazine cover, Forbes Bloomberg style' },
          { id: 'tai-kung-pao', label: '太公報惡搞風格', prompt: 'Chinese newspaper parody, sensational headlines' },
          { id: 'lemon-daily', label: '檸檬日報風格', prompt: 'quirky newspaper design, yellow tones, playful' },
          { id: 'hk-manga-fight', label: '港漫四格打鬥', prompt: 'Hong Kong manga 4-panel fight scene, dynamic action' },
        ]
      }
    }
  },
  social: {
    label: '社交媒體',
    subCategories: {
      sticker: {
        label: '貼紙生成',
        styles: [
          { id: 'whatsapp-sticker', label: 'WhatsApp Sticker', prompt: 'cute sticker design, transparent background, expressive, kawaii' },
        ]
      },
      youtube: {
        label: 'YouTube火爆封面圖',
        styles: [
          { id: 'youtube-thumbnail', label: 'Youtube封面', prompt: 'eye-catching YouTube thumbnail, bold text, vibrant colors, high contrast' },
        ]
      }
    }
  },
  movie: {
    label: '電影海報',
    subCategories: {
      mainstream: {
        label: '主流商業電影',
        styles: [
          { id: 'hollywood', label: '荷里活大片', prompt: 'Hollywood blockbuster movie poster, epic scale, dramatic lighting' },
          { id: 'marvel', label: 'Marvel 超級英雄', prompt: 'Marvel superhero movie poster, dynamic poses, power effects' },
          { id: 'dc-dark', label: 'DC 暗黑風格', prompt: 'DC dark and gritty style, noir lighting, intense atmosphere' },
        ]
      },
      asian: {
        label: '亞洲電影',
        styles: [
          { id: 'japanese-film', label: '日本電影', prompt: 'Japanese movie poster aesthetic, artistic, subtle colors' },
          { id: 'korean-film', label: '韓國電影', prompt: 'Korean cinema style poster, realistic drama, emotional impact' },
          { id: 'hk-film', label: '香港電影', prompt: 'Classic Hong Kong movie poster, action-oriented, bold colors' },
          { id: 'inachu', label: '稻中兵團', prompt: 'Inachu manga parody style, exaggerated comedy, crude humor' },
          { id: 'hk-kam-manga', label: '香港甘小文四格漫畫', prompt: 'Hong Kong 4-panel manga style, local humor, satirical' },
        ]
      }
    }
  },
  artStyle: {
    label: '藝術風格',
    subCategories: {
      artIndependent: {
        label: '藝術與獨立電影',
        styles: [
          { id: 'minimalist-art', label: '極簡主義', prompt: 'minimalist design, clean lines, negative space, modern' },
          { id: 'retro-illustration', label: '復古懷舊手繪插畫', prompt: 'vintage hand-drawn illustration, nostalgic, warm colors' },
        ]
      },
      genre: {
        label: '特定類型',
        styles: [
          { id: 'scifi', label: '科幻未來', prompt: 'sci-fi futuristic design, neon lights, cyberpunk, high-tech' },
          { id: 'horror', label: '恐怖驚悚', prompt: 'horror movie style, dark atmosphere, suspenseful, eerie' },
          { id: 'romance', label: '浪漫愛情', prompt: 'romantic movie poster, soft lighting, dreamy, warm tones' },
        ]
      }
    }
  },
  commercial: {
    label: '商業應用',
    subCategories: {
      ecommerce: {
        label: '電商海報',
        styles: [
          { id: 'product-display', label: '產品展示', prompt: 'e-commerce product showcase, clean background, professional' },
          { id: 'promo', label: '促銷活動', prompt: 'promotional campaign design, bold graphics, call to action' },
          { id: 'fashion', label: '時尚風格', prompt: 'high fashion advertising, editorial style, luxury branding' },
          { id: 'festival', label: '節慶主題', prompt: 'festive holiday theme, celebratory, seasonal decorations' },
          { id: 'flash-sale', label: '限時優惠', prompt: 'flash sale banner, urgent design, countdown aesthetic' },
        ]
      }
    }
  }
};

// Model options with points
const models = [
  { id: 'nano-banana', label: 'Nano Banana', description: '快速生成，適合大部分需求', model: 'google/gemini-2.5-flash-image-preview', points: 1 },
  { id: 'nano-banana-pro', label: 'Nano Banana Pro', description: '更高質量，適合專業需求', model: 'google/gemini-3-pro-image-preview', points: 2 },
  { id: 'seedream', label: 'Seedream', description: '創意夢境風格', model: 'google/gemini-2.5-flash-image-preview', points: 1 },
];

// Upload quality options with size limits
const uploadQualityOptions = [
  { 
    id: 'standard', 
    label: '標準畫質 (5MB)', 
    maxSize: 5 * 1024 * 1024, // 5MB
    description: '社交媒體、網頁展示、小型海報 (A4/Letter)',
    details: '適合 Instagram、Facebook、網站橫幅、小型印刷品。解析度足夠 300 DPI A4 尺寸印刷。',
    recommended: true
  },
  { 
    id: 'high', 
    label: '高畫質 (15MB)', 
    maxSize: 15 * 1024 * 1024, // 15MB
    description: '大型海報 (A2/A1)、展覽印刷',
    details: '適合大型海報、展覽看板、高質量印刷品。支援最大 A1 尺寸 300 DPI 印刷。',
    recommended: false
  },
  { 
    id: 'ultra', 
    label: '超高畫質 (50MB)', 
    maxSize: 50 * 1024 * 1024, // 50MB
    description: '廣告看板、大型橫幅、專業印刷',
    details: '適合戶外廣告看板、大型活動橫幅、專業級印刷。注意：較大檔案會增加儲存成本及上傳時間。',
    recommended: false
  },
];

// Aspect ratio options
const aspectRatios = [
  { id: '16:9', label: '16:9 橫向', description: 'YouTube、電影', width: 1920, height: 1080 },
  { id: '1:1', label: '1:1 正方形', description: 'Instagram、頭像', width: 1024, height: 1024 },
  { id: '9:16', label: '9:16 直向', description: 'Reels、Stories', width: 1080, height: 1920 },
  { id: '4:3', label: '4:3 傳統', description: '傳統相片比例', width: 1024, height: 768 },
];

const ImageGenerationPage = () => {
  // Get user points and generated images
  const { points: userPoints } = useUserPoints();
  const { images: savedImages, saveImage, toggleFavorite } = useGeneratedImages();
  
  // Generation mode
  const [generationMode, setGenerationMode] = useState<'image-to-image' | 'text-to-image'>('image-to-image');
  
  // Image upload states
  const [uploadedImages, setUploadedImages] = useState<Array<{ file: File; preview: string }>>([]);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);
  const [showGalleryDialog, setShowGalleryDialog] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [uploadQuality, setUploadQuality] = useState<'standard' | 'high' | 'ultra'>('standard');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Prompt states
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  
  // Camera angle
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string>('');
  
  // Enhancement options
  const [translateToEnglish, setTranslateToEnglish] = useState(false);
  const [tryOnMode, setTryOnMode] = useState(false);
  const [aiEnhance, setAiEnhance] = useState(false);
  const [preserveFace, setPreserveFace] = useState(false);
  const [avatarGeneration, setAvatarGeneration] = useState(false);
  
  // Style tags
  const [selectedStyleTags, setSelectedStyleTags] = useState<string[]>([]);
  
  // Poster style
  const [showPosterSelector, setShowPosterSelector] = useState(false);
  const [selectedPosterStyle, setSelectedPosterStyle] = useState<string>('');
  const [expandedPosterCategory, setExpandedPosterCategory] = useState<string | null>(null);
  
  // Generation options
  const [selectedModel, setSelectedModel] = useState('nano-banana');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [quantity, setQuantity] = useState(1);
  const [selectedResolution, setSelectedResolution] = useState<'1k' | '2k'>('2k');
  const [selectedOutputFormat, setSelectedOutputFormat] = useState<'jpg' | 'png'>('jpg');
  
  // Results
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ prompt: string; imageUrl: string; isAvatar: boolean }>>([]);
  const [activeGalleryTab, setActiveGalleryTab] = useState<'all' | 'avatars'>('all');
  
  const { toast } = useToast();
  const aspectRatio = aspectRatios.find(ar => ar.id === selectedAspectRatio);
  const currentModel = models.find(m => m.id === selectedModel);
  const currentUploadQuality = uploadQualityOptions.find(q => q.id === uploadQuality);
  const totalPoints = quantity * (currentModel?.points || 1);

  // Handle file upload with size validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const maxSize = currentUploadQuality?.maxSize || 5 * 1024 * 1024;
    const validFiles: File[] = [];
    const oversizedFiles: string[] = [];
    
    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        oversizedFiles.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      } else {
        validFiles.push(file);
      }
    });
    
    if (oversizedFiles.length > 0) {
      toast({ 
        title: '部分檔案超過大小限制', 
        description: `已跳過: ${oversizedFiles.join(', ')}。當前限制: ${currentUploadQuality?.label}`,
        variant: 'destructive' 
      });
    }
    
    if (validFiles.length > 0) {
      const newImages = validFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      
      setUploadedImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 images
      toast({ title: `已上傳 ${validFiles.length} 張圖片` });
    }
  };

  // Handle drop with size validation
  const handleFileDrop = (files: FileList) => {
    const maxSize = currentUploadQuality?.maxSize || 5 * 1024 * 1024;
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    const validFiles: File[] = [];
    const oversizedFiles: string[] = [];
    
    imageFiles.forEach(file => {
      if (file.size > maxSize) {
        oversizedFiles.push(`${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      } else {
        validFiles.push(file);
      }
    });
    
    if (oversizedFiles.length > 0) {
      toast({ 
        title: '部分檔案超過大小限制', 
        description: `已跳過: ${oversizedFiles.join(', ')}。當前限制: ${currentUploadQuality?.label}`,
        variant: 'destructive' 
      });
    }
    
    if (validFiles.length > 0) {
      const newImages = validFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setUploadedImages(prev => [...prev, ...newImages].slice(0, 5));
      toast({ title: `已上傳 ${validFiles.length} 張圖片` });
    } else if (imageFiles.length === 0) {
      toast({ title: '請上傳圖片文件', variant: 'destructive' });
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Handle image reordering via drag and drop
  const handleImageDragStart = (index: number) => {
    setDraggedImageIndex(index);
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedImageIndex === null || draggedImageIndex === index) return;
    
    // Reorder the images
    setUploadedImages(prev => {
      const newImages = [...prev];
      const draggedImage = newImages[draggedImageIndex];
      newImages.splice(draggedImageIndex, 1);
      newImages.splice(index, 0, draggedImage);
      return newImages;
    });
    setDraggedImageIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggedImageIndex(null);
  };

  // Toggle style tag
  const toggleStyleTag = (tagId: string) => {
    if (tagId === 'none') {
      setSelectedStyleTags([]);
      return;
    }
    setSelectedStyleTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  // Get style tag prompt
  const getStyleTagPrompts = () => {
    const prompts: string[] = [];
    Object.values(styleTags).forEach(category => {
      category.tags.forEach(tag => {
        if (selectedStyleTags.includes(tag.id)) {
          prompts.push(tag.label);
        }
      });
    });
    return prompts.join(', ');
  };

  // Get poster style prompt
  const getPosterStylePrompt = () => {
    for (const category of Object.values(posterCategories)) {
      for (const subCat of Object.values(category.subCategories)) {
        const style = subCat.styles.find(s => s.id === selectedPosterStyle);
        if (style) return style.prompt;
      }
    }
    return '';
  };

  // Build full prompt
  const buildFullPrompt = () => {
    const parts = [prompt];
    
    // Add avatar generation prefix
    if (avatarGeneration && generationMode === 'text-to-image') {
      parts.unshift('portrait avatar, profile picture style, centered face composition');
    }
    
    // Add camera angle
    if (selectedCameraAngle) {
      const angle = cameraAngles.find(a => a.id === selectedCameraAngle);
      if (angle) parts.push(angle.prompt);
    }
    
    // Add style tags
    const styleTagPrompt = getStyleTagPrompts();
    if (styleTagPrompt) parts.push(styleTagPrompt);
    
    // Add poster style
    const posterPrompt = getPosterStylePrompt();
    if (posterPrompt) parts.push(posterPrompt);
    
    // Add face preservation
    if (preserveFace && uploadedImages.length > 0) {
      parts.push('preserve all facial features from the reference image');
    }
    
    // Add AI enhance
    if (aiEnhance) {
      parts.push('AI enhanced, high detail, professional quality');
    }
    
    // Add aspect ratio hint
    if (aspectRatio) {
      parts.push(`${aspectRatio.id} aspect ratio`);
    }
    
    return parts.join('. ') + '. Ultra high resolution, professional quality.';
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && generationMode === 'text-to-image') {
      toast({ title: '請輸入圖片描述', variant: 'destructive' });
      return;
    }
    
    if (generationMode === 'image-to-image' && uploadedImages.length === 0 && !selectedGalleryImage) {
      toast({ title: '請先上傳或選擇圖片', variant: 'destructive' });
      return;
    }

    if (totalPoints > userPoints) {
      toast({ title: '點數不足', description: `需要 ${totalPoints} 點但只剩 ${userPoints} 點`, variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);
    
    try {
      const fullPrompt = buildFullPrompt();
      const model = models.find(m => m.id === selectedModel)?.model || 'google/gemini-2.5-flash-image-preview';
      
      const images: string[] = [];
      
      for (let i = 0; i < quantity; i++) {
        const { data, error } = await supabase.functions.invoke('generate-image', {
          body: { 
            prompt: fullPrompt, 
            style: selectedPosterStyle || selectedStyleTags[0] || 'default',
            model,
            width: aspectRatio?.width,
            height: aspectRatio?.height,
          }
        });

        if (error) throw error;

        if (data.imageUrl) {
          images.push(data.imageUrl);
          setGeneratedImages([...images]);
        } else if (data.error) {
          throw new Error(data.error);
        }
      }
      
      if (images.length > 0) {
        setSelectedImage(images[0]);
        const isAvatarImage = avatarGeneration && generationMode === 'text-to-image';
        
        // Save to database and local history
        for (const imageUrl of images) {
          try {
            await saveImage({
              prompt,
              image_url: imageUrl,
              title: title || undefined,
              is_avatar: isAvatarImage,
              style: selectedPosterStyle || selectedStyleTags[0] || undefined,
              model: selectedModel,
              aspect_ratio: selectedAspectRatio,
            });
          } catch (saveError) {
            console.error('Failed to save image to database:', saveError);
          }
          setHistory(prev => [{ prompt, imageUrl, isAvatar: isAvatarImage }, ...prev.slice(0, 49)]);
        }
        
        toast({ title: `成功生成 ${images.length} 張圖片！` });
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast({ 
        title: '生成失敗', 
        description: error instanceof Error ? error.message : '請稍後重試',
        variant: 'destructive' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (imageUrl?: string) => {
    const url = imageUrl || selectedImage;
    if (!url) return;
    
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `clovers-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: '下載開始' });
    } catch (error) {
      toast({ title: '下載失敗', variant: 'destructive' });
    }
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      uploadedImages.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Points Balance */}
      <PointsBalanceCard />

      {/* Header with points info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="heading-display text-xl sm:text-2xl mb-1">AI 圖像生成</h1>
          <p className="text-sm sm:text-base text-muted-foreground">選擇生成模式並創建精美圖像</p>
        </div>
        <Link to="/dashboard/gallery">
          <Button variant="outline" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            圖庫
          </Button>
        </Link>
      </div>

      {/* Generation Mode Tabs */}
      <Tabs value={generationMode} onValueChange={(val) => setGenerationMode(val as 'image-to-image' | 'text-to-image')}>
        <TabsList className="grid grid-cols-2 w-full max-w-md h-auto">
          <TabsTrigger value="image-to-image" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-4">
            <ImagePlus className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">產品/主角圖片生成</span>
          </TabsTrigger>
          <TabsTrigger value="text-to-image" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-4">
            <Type className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">文字生成圖片</span>
          </TabsTrigger>
        </TabsList>
        
        <p className="text-xs sm:text-sm text-muted-foreground mt-2">
          {generationMode === 'image-to-image' 
            ? '📸 上傳圖片作為參考，生成風格化的新圖片'
            : '✨ 純文字描述生成全新圖片'}
        </p>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Image Upload Section (only for image-to-image mode) */}
          {generationMode === 'image-to-image' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">產品或主角圖片</CardTitle>
                <CardDescription>
                  上傳或選擇產品或主角圖片，或從圖庫選擇已生成的圖片
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Quality Selector */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">上傳畫質設定</Label>
                  <p className="text-xs text-muted-foreground">根據您的用途選擇適合的畫質，較高畫質會增加儲存成本</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {uploadQualityOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setUploadQuality(option.id as 'standard' | 'high' | 'ultra')}
                        className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                          uploadQuality === option.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {option.recommended && (
                          <Badge className="absolute -top-2 right-2 text-[10px]">推薦</Badge>
                        )}
                        <div className="font-medium text-sm mb-1">{option.label}</div>
                        <div className="text-xs text-muted-foreground mb-2">{option.description}</div>
                        <div className="text-xs text-muted-foreground/70">{option.details}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Area with Drag and Drop */}
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.add('border-primary', 'bg-primary/5');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                    
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      handleFileDrop(files);
                    }
                  }}
                >
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">點擊或拖拽產品/主角圖片到此處上傳</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    支援各種圖片格式，當前限制: {currentUploadQuality?.label}。第一張圖片將作為主角
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                {/* Gallery Selection Button */}
                <Dialog open={showGalleryDialog} onOpenChange={setShowGalleryDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2">
                      <Grid3X3 className="w-4 h-4" />
                      從圖庫選擇圖片
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-2xl mx-2 sm:mx-auto">
                    <DialogHeader>
                      <DialogTitle>從圖庫選擇圖片</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[300px] sm:h-[400px]">
                      {history.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 p-2">
                          {history.map((item, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setSelectedGalleryImage(item.imageUrl);
                                setShowGalleryDialog(false);
                                toast({ title: '已選擇圖片' });
                              }}
                              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                selectedGalleryImage === item.imageUrl ? 'border-primary' : 'border-transparent hover:border-primary/50'
                              }`}
                            >
                              <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <Image className="w-12 h-12 mb-2 opacity-50" />
                          <p>尚未生成任何圖像</p>
                        </div>
                      )}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>

                {/* Uploaded Images Preview - Always show section */}
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium py-2">
                    已上傳的圖片：
                    <ChevronDown className="w-4 h-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-3">
                    {(uploadedImages.length > 0 || selectedGalleryImage) ? (
                      <>
                        {uploadedImages.length > 1 && (
                          <p className="text-xs text-muted-foreground mb-2">💡 拖拽圖片以重新排序，第一張將作為主角</p>
                        )}
                        <div className="flex flex-wrap gap-3">
                          {uploadedImages.map((img, index) => (
                            <div 
                              key={img.preview} 
                              className={`relative group cursor-grab active:cursor-grabbing transition-all duration-200 ${
                                draggedImageIndex === index ? 'opacity-50 scale-95' : ''
                              }`}
                              draggable
                              onDragStart={() => handleImageDragStart(index)}
                              onDragOver={(e) => handleImageDragOver(e, index)}
                              onDragEnd={handleImageDragEnd}
                            >
                              <img 
                                src={img.preview} 
                                alt={`Uploaded ${index + 1}`}
                                className="w-20 h-20 object-cover rounded-lg border pointer-events-none"
                              />
                              <button
                                onClick={() => removeUploadedImage(index)}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              {index === 0 && (
                                <Badge className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] px-1 bg-primary">主角</Badge>
                              )}
                            </div>
                          ))}
                          {selectedGalleryImage && (
                            <div className="relative group">
                              <img 
                                src={selectedGalleryImage} 
                                alt="Selected from gallery"
                                className="w-20 h-20 object-cover rounded-lg border border-primary"
                              />
                              <button
                                onClick={() => setSelectedGalleryImage(null)}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">尚未上傳任何圖片</p>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          )}

          {/* Prompt Input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wand2 className="w-5 h-5 text-primary" />
                提示詞
              </CardTitle>
              <CardDescription>描述您想要生成的圖像風格和內容</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Optional Title with Generated Content Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>標題（可選）</Label>
                  {history.length > 0 && (
                    <Select 
                      value="" 
                      onValueChange={(value) => {
                        const selected = history.find(h => h.prompt === value);
                        if (selected) {
                          setTitle(selected.prompt.slice(0, 50));
                          setPrompt(selected.prompt);
                        }
                      }}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="選擇已生成內容" />
                      </SelectTrigger>
                      <SelectContent>
                        {history.map((item, index) => (
                          <SelectItem key={index} value={item.prompt}>
                            {item.prompt.slice(0, 30)}{item.prompt.length > 30 ? '...' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <Input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="為您的創作命名..."
                />
              </div>

              {/* Camera Angle Quick Select */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>快速選擇鏡頭提示詞</Label>
                  <Select value={selectedCameraAngle} onValueChange={setSelectedCameraAngle}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="選擇預設鏡頭提示詞" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="none">無</SelectItem>
                      {cameraAngles.map(angle => (
                        <SelectItem key={angle.id} value={angle.id}>{angle.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Main Prompt */}
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="例如：一隻可愛的柴犬在櫻花樹下奔跑..."
                rows={4}
                className="resize-none"
              />

              {/* Enhancement Options */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="translate" 
                    checked={translateToEnglish}
                    onCheckedChange={setTranslateToEnglish}
                  />
                  <Label htmlFor="translate" className="flex items-center gap-1 cursor-pointer">
                    <Languages className="w-4 h-4" />
                    翻譯英文
                  </Label>
                </div>
                
                {generationMode === 'image-to-image' && (
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="tryon" 
                      checked={tryOnMode}
                      onCheckedChange={setTryOnMode}
                      disabled={uploadedImages.length === 0 && !selectedGalleryImage}
                    />
                    <Label htmlFor="tryon" className="flex items-center gap-1 cursor-pointer">
                      <Shirt className="w-4 h-4" />
                      試衣 {(uploadedImages.length === 0 && !selectedGalleryImage) && '(請先選擇圖片)'}
                    </Label>
                  </div>
                )}

                {generationMode === 'text-to-image' && (
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="avatar-gen" 
                      checked={avatarGeneration}
                      onCheckedChange={setAvatarGeneration}
                    />
                    <Label htmlFor="avatar-gen" className="flex items-center gap-1 cursor-pointer">
                      <Camera className="w-4 h-4" />
                      頭像生成
                    </Label>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Switch 
                    id="enhance" 
                    checked={aiEnhance}
                    onCheckedChange={setAiEnhance}
                  />
                  <Label htmlFor="enhance" className="flex items-center gap-1 cursor-pointer">
                    <Zap className="w-4 h-4" />
                    AI增強
                  </Label>
                </div>
              </div>

              {/* Preserve Face Option */}
              {generationMode === 'image-to-image' && (uploadedImages.length > 0 || selectedGalleryImage) && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Switch 
                    id="preserve-face" 
                    checked={preserveFace}
                    onCheckedChange={setPreserveFace}
                  />
                  <Label htmlFor="preserve-face" className="cursor-pointer">
                    上傳圖是我的主角，要保留所有面部特徵
                  </Label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Style Tags */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">風格標籤</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(styleTags).map(([key, category]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-muted-foreground">{category.label}</Label>
                  <div className="flex flex-wrap gap-2">
                    {category.tags.map(tag => (
                      <Badge
                        key={tag.id}
                        variant={selectedStyleTags.includes(tag.id) || (tag.id === 'none' && selectedStyleTags.length === 0) ? 'default' : 'outline'}
                        className="cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => toggleStyleTag(tag.id)}
                      >
                        {tag.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Poster Style Selector */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">海報風格選擇器</CardTitle>
                  <CardDescription>選擇以下風格，自動生成AI提示詞</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="poster-toggle">切換</Label>
                  <Switch 
                    id="poster-toggle" 
                    checked={showPosterSelector}
                    onCheckedChange={setShowPosterSelector}
                  />
                </div>
              </div>
            </CardHeader>
            {showPosterSelector && (
              <CardContent className="space-y-4">
                {Object.entries(posterCategories).map(([catKey, category]) => (
                  <Collapsible 
                    key={catKey}
                    open={expandedPosterCategory === catKey}
                    onOpenChange={(open) => setExpandedPosterCategory(open ? catKey : null)}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                      <span className="font-medium">{category.label}</span>
                      {expandedPosterCategory === catKey ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3 space-y-3">
                      {Object.entries(category.subCategories).map(([subKey, subCat]) => (
                        <div key={subKey} className="space-y-2">
                          <Label className="text-sm text-muted-foreground">{subCat.label}</Label>
                          <div className="flex flex-wrap gap-2">
                            {subCat.styles.map(style => (
                              <Badge
                                key={style.id}
                                variant={selectedPosterStyle === style.id ? 'default' : 'outline'}
                                className="cursor-pointer hover:bg-primary/20 transition-colors"
                                onClick={() => setSelectedPosterStyle(
                                  selectedPosterStyle === style.id ? '' : style.id
                                )}
                              >
                                {style.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CardContent>
            )}
          </Card>

          {/* Generation Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                生成選項
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Model Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">生成模型選擇</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedModel === model.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-sm">{model.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{model.description}</div>
                      <Badge variant="secondary" className="mt-2 text-xs">{model.points} 點</Badge>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nano Banana Pro Options - Resolution & Output Format */}
              {selectedModel === 'nano-banana-pro' && (
                <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border border-primary/20">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Star className="w-4 h-4" />
                    Nano Banana Pro 專屬選項
                  </div>
                  
                  {/* Resolution Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">解析度:</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedResolution('1k')}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedResolution === '1k' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-sm">1K (標準)</div>
                        <div className="text-xs text-muted-foreground mt-1">適合社交媒體</div>
                      </button>
                      <button
                        onClick={() => setSelectedResolution('2k')}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedResolution === '2k' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-sm flex items-center gap-1">
                          2K (推薦)
                          <Badge variant="default" className="text-[10px] px-1">推薦</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">高清輸出</div>
                      </button>
                    </div>
                  </div>

                  {/* Output Format Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">輸出格式:</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedOutputFormat('jpg')}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedOutputFormat === 'jpg' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-sm">JPG (較小檔案)</div>
                        <div className="text-xs text-muted-foreground mt-1">檔案較小，適合分享</div>
                      </button>
                      <button
                        onClick={() => setSelectedOutputFormat('png')}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedOutputFormat === 'png' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium text-sm">PNG (無損)</div>
                        <div className="text-xs text-muted-foreground mt-1">無損壓縮，保留細節</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Aspect Ratio */}
              <div className="space-y-2">
                <label className="text-sm font-medium">長寬比</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {aspectRatios.map((ar) => (
                    <button
                      key={ar.id}
                      onClick={() => setSelectedAspectRatio(ar.id)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        selectedAspectRatio === ar.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-sm">{ar.label}</div>
                      <div className="text-xs text-muted-foreground">{ar.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">生成數量</label>
                  <span className="text-sm text-muted-foreground">{quantity} 張</span>
                </div>
                <Slider
                  value={[quantity]}
                  onValueChange={([val]) => setQuantity(val)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>最多可生成 10 張圖片</span>
                  <span>10</span>
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || totalPoints > userPoints}
                className="w-full gap-2 h-12 text-lg"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    生成 {quantity} 張圖像 ({totalPoints} 點數)
                  </>
                )}
              </Button>
              
              {totalPoints > userPoints && (
                <p className="text-sm text-destructive text-center">
                  點數不足，需要 {totalPoints} 點但只剩 {userPoints} 點
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Results */}
        <div className="space-y-4 sm:space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>生成結果</CardTitle>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setHistory([])}
                  disabled={history.length === 0}
                >
                  <Grid3X3 className="w-4 h-4 mr-1" />
                  圖庫
                </Button>
              </div>
              <CardDescription>您生成的圖像將顯示在這裡</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedImage ? (
                <div className="space-y-4">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={selectedImage} 
                      alt="Generated" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <Button className="w-full gap-2" onClick={() => handleDownload()}>
                    <Download className="w-4 h-4" />
                    下載
                  </Button>
                  
                  {/* Thumbnails for multiple images */}
                  {generatedImages.length > 1 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {generatedImages.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(img)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            selectedImage === img ? 'border-primary' : 'border-transparent hover:border-primary/50'
                          }`}
                        >
                          <img 
                            src={img} 
                            alt={`Generated ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : isGenerating ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Loader2 className="w-16 h-16 mb-4 animate-spin text-primary" />
                  <p>正在生成圖片...</p>
                  <p className="text-sm mt-1">請稍候</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Image className="w-16 h-16 mb-4 opacity-50" />
                  <p>尚未生成任何圖像</p>
                  <p className="text-sm mt-1">完成設定後點擊生成按鈕開始</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History / Gallery */}
          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">圖庫</CardTitle>
                  <div className="flex gap-1 bg-muted rounded-lg p-1">
                    <button
                      onClick={() => setActiveGalleryTab('all')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                        activeGalleryTab === 'all' 
                          ? 'bg-background shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Grid3X3 className="w-3 h-3" />
                      全部
                    </button>
                    <button
                      onClick={() => setActiveGalleryTab('avatars')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                        activeGalleryTab === 'avatars' 
                          ? 'bg-background shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <User className="w-3 h-3" />
                      頭像
                      {history.filter(h => h.isAvatar).length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                          {history.filter(h => h.isAvatar).length}
                        </Badge>
                      )}
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const filteredHistory = activeGalleryTab === 'avatars' 
                    ? history.filter(h => h.isAvatar) 
                    : history;
                  
                  if (filteredHistory.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <User className="w-12 h-12 mb-3 opacity-50" />
                        <p className="text-sm">尚未生成任何頭像</p>
                        <p className="text-xs mt-1">開啟「頭像生成」選項來生成頭像</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                      {filteredHistory.map((item, index) => (
                        <button 
                          key={index} 
                          className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all group"
                          onClick={() => setSelectedImage(item.imageUrl)}
                        >
                          <img 
                            src={item.imageUrl} 
                            alt={item.prompt} 
                            className="w-full h-full object-cover"
                          />
                          {item.isAvatar && (
                            <div className="absolute top-1 left-1">
                              <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-background/80">
                                <User className="w-2.5 h-2.5 mr-0.5" />
                                頭像
                              </Badge>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Download 
                              className="w-5 h-5 text-white cursor-pointer hover:scale-110 transition-transform"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(item.imageUrl);
                              }}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerationPage;
