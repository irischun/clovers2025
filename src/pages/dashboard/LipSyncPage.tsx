import { useState, useRef, useEffect } from 'react';
import PointsBalanceCard from '@/components/dashboard/PointsBalanceCard';
import { Video, Upload, Loader2, Play, Download, Image, Heart, Filter, Grid3X3, List, Music, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GeneratedImage {
  id: string;
  prompt: string;
  image_url: string;
  title: string | null;
  style: string | null;
  is_favorite: boolean | null;
  created_at: string;
}

interface VoiceGeneration {
  id: string;
  voice_name: string;
  audio_url: string | null;
  text_content: string;
  created_at: string;
}

const LipSyncPage = () => {
  // Image selection
  const [imageTab, setImageTab] = useState<'gallery' | 'upload'>('gallery');
  const [galleryImages, setGalleryImages] = useState<GeneratedImage[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [uploadedMediaType, setUploadedMediaType] = useState<'image' | 'video' | null>(null);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [hideYoutubeImages, setHideYoutubeImages] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [imageViewMode, setImageViewMode] = useState<'grid' | 'list'>('grid');
  const [isImageSectionOpen, setIsImageSectionOpen] = useState(true);

  // Audio selection
  const [audioTab, setAudioTab] = useState<'generated' | 'upload'>('generated');
  const [voiceGenerations, setVoiceGenerations] = useState<VoiceGeneration[]>([]);
  const [selectedAudioUrl, setSelectedAudioUrl] = useState<string | null>(null);
  const [uploadedAudio, setUploadedAudio] = useState<File | null>(null);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [audioViewMode, setAudioViewMode] = useState<'grid' | 'list'>('grid');

  // Video settings
  const [videoTitle, setVideoTitle] = useState('');
  const [videoOrientation, setVideoOrientation] = useState('portrait');

  // Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch gallery images
  useEffect(() => {
    const fetchImages = async () => {
      setIsLoadingImages(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoadingImages(false); return; }

      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setGalleryImages(data);
      }
      setIsLoadingImages(false);
    };
    fetchImages();
  }, []);

  // Fetch voice generations
  useEffect(() => {
    const fetchVoices = async () => {
      setIsLoadingVoices(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoadingVoices(false); return; }

      const { data, error } = await supabase
        .from('voice_generations')
        .select('id, voice_name, audio_url, text_content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setVoiceGenerations(data);
      }
      setIsLoadingVoices(false);
    };
    fetchVoices();
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      setSelectedImageUrl(null);
      setUploadedMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      const url = URL.createObjectURL(file);
      setUploadedImagePreview(url);
      toast({ title: '素材已上傳', description: file.name });
    }
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedAudio(file);
      setSelectedAudioUrl(null);
      toast({ title: '音訊已上傳', description: file.name });
    }
  };

  const handleSelectGalleryImage = (url: string) => {
    setSelectedImageUrl(url);
    setUploadedImage(null);
    setUploadedImagePreview(null);
    setUploadedMediaType(null);
  };

  const handleSelectVoice = (audioUrl: string) => {
    setSelectedAudioUrl(audioUrl);
    setUploadedAudio(null);
  };

  const getSelectedImageUrl = (): string | null => {
    if (imageTab === 'gallery') return selectedImageUrl;
    return uploadedImagePreview;
  };

  const getSelectedAudioSource = (): boolean => {
    if (audioTab === 'generated') return !!selectedAudioUrl;
    return !!uploadedAudio;
  };

  const filteredImages = galleryImages.filter(img => {
    if (showFavoritesOnly && !img.is_favorite) return false;
    if (hideYoutubeImages && img.style?.toLowerCase().includes('youtube')) return false;
    return true;
  });

  const handleGenerate = async () => {
    const imageUrl = getSelectedImageUrl();
    if (!imageUrl) {
      toast({ title: '請選擇或上傳圖片', variant: 'destructive' });
      return;
    }
    if (!getSelectedAudioSource()) {
      toast({ title: '請選擇或上傳音訊', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      toast({
        title: 'LipSync 影片生成',
        description: '此功能需要連接 LipSync API。請在設定中配置相關服務。'
      });
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Points Balance */}
      <PointsBalanceCard />

      {/* Audio/Video Splitter Banner */}
      <Card className="bg-muted/50 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎬</span>
              <div>
                <p className="font-medium">音訊/影片自動分割工具</p>
                <p className="text-sm text-muted-foreground">將 MP4 或 MP3 自動分割為不同語音片段</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1" asChild>
              <a href="https://mp3splitter-nkadbiss.manus.space/" target="_blank" rel="noopener noreferrer">
                立即使用
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Credits display */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-3">
          <p className="text-sm">
            <span className="font-medium text-primary">點數消耗：15 點/10 秒</span>
            <span className="text-muted-foreground ml-2">（每 10 秒音訊消耗 15 點）</span>
          </p>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">✨</span>
        <div>
          <h1 className="heading-display text-2xl mb-1">LipSync 影片生成</h1>
          <p className="text-muted-foreground">上傳或選擇圖片和音訊，生成專業的口型同步影片</p>
        </div>
      </div>

      {/* Gallery Link */}
      <Button variant="outline" className="w-full gap-2">
        <Video className="w-4 h-4" />
        查看作品畫廊
      </Button>

      {/* Image Selection Section */}
      <Card>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => setIsImageSectionOpen(!isImageSectionOpen)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              選擇圖片
            </CardTitle>
            {isImageSectionOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </CardHeader>
        {isImageSectionOpen && (
          <CardContent className="space-y-4">
            <Tabs value={imageTab} onValueChange={(v) => setImageTab(v as 'gallery' | 'upload')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="gallery">從畫廊選擇</TabsTrigger>
                <TabsTrigger value="upload">上傳圖片</TabsTrigger>
              </TabsList>

              <TabsContent value="gallery" className="mt-4 space-y-4">
                {/* Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Button
                    variant={hideYoutubeImages ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setHideYoutubeImages(!hideYoutubeImages)}
                  >
                    隱藏YouTube圖片
                  </Button>
                  <Button
                    variant={showFavoritesOnly ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className="gap-1"
                  >
                    <Heart className="w-3 h-3" />
                    收藏圖片
                  </Button>
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      variant={imageViewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setImageViewMode('grid')}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={imageViewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setImageViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Image Grid/List */}
                {isLoadingImages ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredImages.length > 0 ? (
                  <div className={imageViewMode === 'grid' 
                    ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[400px] overflow-y-auto' 
                    : 'space-y-2 max-h-[400px] overflow-y-auto'
                  }>
                    {filteredImages.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => handleSelectGalleryImage(img.image_url)}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageUrl === img.image_url
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-transparent hover:border-primary/50'
                        } ${imageViewMode === 'list' ? 'flex items-center gap-3 p-2' : ''}`}
                      >
                        <img
                          src={img.image_url}
                          alt={img.title || img.prompt}
                          className={imageViewMode === 'grid' 
                            ? 'w-full aspect-square object-cover' 
                            : 'w-16 h-16 object-cover rounded'
                          }
                        />
                        {imageViewMode === 'list' && (
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{img.title || img.prompt.substring(0, 40)}</p>
                            <p className="text-xs text-muted-foreground">{img.style || ''}</p>
                          </div>
                        )}
                        {img.is_favorite && (
                          <Heart className="absolute top-1 right-1 w-3 h-3 text-red-500 fill-red-500" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>暫無圖片，請先使用圖片生成功能</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    uploadedImage ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
                  }`}
                >
                  {uploadedImagePreview ? (
                    <div className="space-y-3">
                      {uploadedMediaType === 'video' ? (
                        <video src={uploadedImagePreview} controls className="max-h-48 mx-auto rounded-lg" />
                      ) : (
                        <img src={uploadedImagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                      )}
                      <p className="text-sm font-medium">{uploadedImage?.name}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedImage(null);
                          setUploadedImagePreview(null);
                          setUploadedMediaType(null);
                          if (imageInputRef.current) imageInputRef.current.value = '';
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        移除
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="font-medium">點擊上傳圖像或視頻</p>
                      <p className="text-sm text-muted-foreground mt-1">支援格式: JPG, PNG, WebP, MKV, WebM, MP4, MOV, AVI</p>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>

      {/* Audio Selection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            選擇音訊
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={audioTab} onValueChange={(v) => setAudioTab(v as 'generated' | 'upload')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generated">已生成語音</TabsTrigger>
              <TabsTrigger value="upload">上傳音訊</TabsTrigger>
            </TabsList>

            <TabsContent value="generated" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">已生成語音 ({voiceGenerations.length})</p>
                <div className="flex items-center gap-1">
                  <Button
                    variant={audioViewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setAudioViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={audioViewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setAudioViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {isLoadingVoices ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : voiceGenerations.length > 0 ? (
                <div className={audioViewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto'
                  : 'space-y-2 max-h-[300px] overflow-y-auto'
                }>
                  {voiceGenerations.map((voice) => (
                    <div
                      key={voice.id}
                      onClick={() => voice.audio_url && handleSelectVoice(voice.audio_url)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedAudioUrl === voice.audio_url
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                          : 'border-border hover:border-primary/50'
                      } ${audioViewMode === 'list' ? 'flex items-center gap-3' : ''}`}
                    >
                      <div className={audioViewMode === 'grid' ? 'text-center' : 'flex items-center gap-3 flex-1 min-w-0'}>
                        {audioViewMode === 'grid' && (
                          <Music className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        )}
                        {audioViewMode === 'list' && (
                          <Music className="w-5 h-5 text-muted-foreground shrink-0" />
                        )}
                        <div className={audioViewMode === 'list' ? 'flex-1 min-w-0' : ''}>
                          <p className="text-sm font-medium truncate">{voice.voice_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {voice.text_content.substring(0, 30)}...
                          </p>
                        </div>
                      </div>
                      {voice.audio_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={audioViewMode === 'grid' ? 'mt-2 w-full' : ''}
                          onClick={(e) => {
                            e.stopPropagation();
                            const audio = new Audio(voice.audio_url!);
                            audio.play();
                          }}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          試聽
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>尚無已生成的語音</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="hidden"
              />
              <div
                onClick={() => audioInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  uploadedAudio ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
                }`}
              >
                {uploadedAudio ? (
                  <div className="space-y-2">
                    <Music className="w-10 h-10 mx-auto text-primary" />
                    <p className="text-sm font-medium">{uploadedAudio.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedAudio.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedAudio(null);
                        if (audioInputRef.current) audioInputRef.current.value = '';
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      移除
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium">點擊上傳音訊</p>
                    <p className="text-sm text-muted-foreground mt-1">支援 MP3, WAV, M4A, AAC</p>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Video Title */}
      <div className="space-y-2">
        <Label>影片標題（選填）</Label>
        <Input
          value={videoTitle}
          onChange={(e) => setVideoTitle(e.target.value)}
          placeholder="輸入影片標題"
        />
      </div>

      {/* Video Orientation */}
      <div className="space-y-2">
        <Label>影片方向</Label>
        <Select value={videoOrientation} onValueChange={setVideoOrientation}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="portrait">直向（Portrait - 9:16）</SelectItem>
            <SelectItem value="landscape">橫向（Landscape - 16:9）</SelectItem>
            <SelectItem value="square">正方形（Square - 1:1）</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={isProcessing || (!getSelectedImageUrl()) || (!getSelectedAudioSource())}
        className="w-full h-12 text-lg gap-2"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            生成中...
          </>
        ) : (
          <>
            <Video className="w-5 h-5" />
            生成 LipSync 影片
          </>
        )}
      </Button>
    </div>
  );
};

export default LipSyncPage;
