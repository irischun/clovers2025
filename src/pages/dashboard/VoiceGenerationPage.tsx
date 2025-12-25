import { useState, useRef, useEffect } from 'react';
import { Volume2, Loader2, Play, Pause, Download, Star, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const languages = [
  { id: 'yue', label: '粵語 (廣東話)' },
  { id: 'zh', label: '普通話' },
  { id: 'en', label: 'English' },
  { id: 'ko', label: '한국어' },
  { id: 'ja', label: '日本語' },
  { id: 'fr', label: 'Français' },
  { id: 'de', label: 'Deutsch' },
  { id: 'es', label: 'Español' },
  { id: 'pt', label: 'Português' },
  { id: 'it', label: 'Italiano' },
  { id: 'ru', label: 'Русский' },
  { id: 'ar', label: 'العربية' },
  { id: 'hi', label: 'हिन्दी' },
  { id: 'th', label: 'ไทย' },
  { id: 'vi', label: 'Tiếng Việt' },
  { id: 'id', label: 'Bahasa Indonesia' },
  { id: 'ms', label: 'Bahasa Melayu' },
  { id: 'tl', label: 'Tagalog' },
  { id: 'tr', label: 'Türkçe' },
  { id: 'pl', label: 'Polski' },
  { id: 'nl', label: 'Nederlands' },
  { id: 'sv', label: 'Svenska' },
  { id: 'da', label: 'Dansk' },
  { id: 'no', label: 'Norsk' },
  { id: 'fi', label: 'Suomi' },
  { id: 'el', label: 'Ελληνικά' },
  { id: 'cs', label: 'Čeština' },
  { id: 'sk', label: 'Slovenčina' },
  { id: 'hu', label: 'Magyar' },
  { id: 'ro', label: 'Română' },
  { id: 'bg', label: 'Български' },
  { id: 'uk', label: 'Українська' },
  { id: 'hr', label: 'Hrvatski' },
  { id: 'sr', label: 'Српски' },
  { id: 'sl', label: 'Slovenščina' },
  { id: 'et', label: 'Eesti' },
  { id: 'lv', label: 'Latviešu' },
  { id: 'lt', label: 'Lietuvių' },
  { id: 'he', label: 'עברית' },
  { id: 'fa', label: 'فارسی' },
];

const voices = [
  { id: 'male-qn-qingse', label: '男聲 - 清澈' },
  { id: 'female-shaonv', label: '女聲 - 少女' },
  { id: 'male-qn-jingying', label: '男聲 - 精英' },
  { id: 'female-yujie', label: '女聲 - 御姐' },
  { id: 'presenter_male', label: '主播男聲' },
  { id: 'presenter_female', label: '主播女聲' },
  { id: 'audiobook_female_1', label: '智慧女性' },
  { id: 'audiobook_male_1', label: '友善之人' },
  { id: 'audiobook_female_2', label: '勵志女孩' },
  { id: 'audiobook_male_2', label: '深沉男聲' },
  { id: 'female-calm', label: '冷靜女性' },
  { id: 'female-lively', label: '活潑女孩' },
  { id: 'male-patient', label: '耐心男士' },
  { id: 'male-young-knight', label: '年輕騎士' },
  { id: 'male-firm', label: '堅定男人' },
  { id: 'female-cute', label: '可愛女孩' },
  { id: 'male-righteous', label: '正派男孩' },
  { id: 'male-majestic', label: '威嚴風範' },
  { id: 'male-elegant', label: '優雅男士' },
  { id: 'female-abbess', label: '女修道院長' },
  { id: 'female-sweet-2', label: '甜美女孩2' },
  { id: 'female-excited', label: '興奮女孩' },
];

const emotions = [
  { id: 'neutral', label: '中性' },
  { id: 'happy', label: '快樂' },
  { id: 'sad', label: '悲傷' },
  { id: 'angry', label: '憤怒' },
  { id: 'fear', label: '恐懼' },
  { id: 'disgust', label: '厭惡' },
  { id: 'surprise', label: '驚訝' },
];

const sampleRates = [
  { id: 8000, label: '8000 Hz' },
  { id: 16000, label: '16000 Hz' },
  { id: 22050, label: '22050 Hz' },
  { id: 24000, label: '24000 Hz' },
  { id: 32000, label: '32000 Hz' },
  { id: 44100, label: '44100 Hz' },
];

const bitrates = [
  { id: 32000, label: '32000 bps' },
  { id: 64000, label: '64000 bps' },
  { id: 128000, label: '128000 bps' },
  { id: 256000, label: '256000 bps' },
];

const formats = [
  { id: 'mp3', label: 'MP3' },
  { id: 'pcm', label: 'PCM' },
  { id: 'flac', label: 'FLAC' },
];

interface VoiceHistory {
  id: string;
  text_content: string;
  language: string;
  voice_id: string;
  voice_name: string;
  model: string;
  audio_url: string | null;
  is_favorite: boolean;
  created_at: string;
}

const VoiceGenerationPage = () => {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('yue');
  const [voice, setVoice] = useState('male-qn-qingse');
  const [model, setModel] = useState('turbo');
  const [speed, setSpeed] = useState([1.0]);
  const [volumeLevel, setVolumeLevel] = useState([1.0]);
  const [pitch, setPitch] = useState([0]);
  const [emotion, setEmotion] = useState('neutral');
  const [textNormalization, setTextNormalization] = useState(true);
  const [sampleRate, setSampleRate] = useState('44100');
  const [bitrate, setBitrate] = useState('128000');
  const [format, setFormat] = useState('mp3');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [history, setHistory] = useState<VoiceHistory[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('voice_generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory((data as VoiceHistory[]) || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({ title: '請輸入要轉換的文字', variant: 'destructive' });
      return;
    }

    if (text.length > 5000) {
      toast({ title: '文字長度不能超過 5000 字符', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const response = await supabase.functions.invoke('voice-generate', {
        body: {
          text,
          language,
          voiceId: voice,
          model,
          speed: speed[0],
          volume: volumeLevel[0],
          pitch: pitch[0],
          emotion,
          textNormalization,
          sampleRate: parseInt(sampleRate),
          bitrate: parseInt(bitrate),
          format,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Voice generation failed');
      }

      const { audioContent, error } = response.data;
      
      if (error) {
        throw new Error(error);
      }

      if (audioContent) {
        const audioBlob = base64ToBlob(audioContent, `audio/${format}`);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Save to history if user is logged in
        if (user) {
          const voiceLabel = voices.find(v => v.id === voice)?.label || voice;
          await supabase.from('voice_generations').insert({
            user_id: user.id,
            text_content: text,
            language,
            voice_id: voice,
            voice_name: voiceLabel,
            model,
            speed: speed[0],
            volume: volumeLevel[0],
            pitch: pitch[0],
            emotion,
            sample_rate: parseInt(sampleRate),
            bitrate: parseInt(bitrate),
            format,
            audio_url: url,
          });
          loadHistory();
        }

        toast({ title: '語音生成成功！' });
      }
    } catch (error: any) {
      console.error('Voice generation error:', error);
      toast({ 
        title: '語音生成失敗', 
        description: error.message || '請檢查 API 設定或稍後重試',
        variant: 'destructive' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const handlePlay = () => {
    if (!audioUrl) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `voice_${Date.now()}.${format}`;
    a.click();
  };

  const toggleFavorite = async (id: string, currentState: boolean) => {
    try {
      await supabase
        .from('voice_generations')
        .update({ is_favorite: !currentState })
        .eq('id', id);
      loadHistory();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      await supabase.from('voice_generations').delete().eq('id', id);
      loadHistory();
      toast({ title: '已刪除' });
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const loadFromHistory = (item: VoiceHistory) => {
    setText(item.text_content);
    setLanguage(item.language);
    setVoice(item.voice_id);
    setModel(item.model);
    if (item.audio_url) {
      setAudioUrl(item.audio_url);
    }
    toast({ title: '已載入歷史記錄' });
  };

  const filteredHistory = showFavoritesOnly 
    ? history.filter(h => h.is_favorite) 
    : history;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="heading-display text-2xl mb-1">語音生成</h1>
        <p className="text-muted-foreground">使用 MiniMax AI 將文字轉換為自然語音，支援40種語言包括廣東話</p>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList>
          <TabsTrigger value="generate">語音生成</TabsTrigger>
          <TabsTrigger value="history">語音歷史</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Input */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-primary" />
                    文字轉語音
                  </CardTitle>
                  <CardDescription>輸入文字並選擇語言、聲音和模型來生成語音</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>文字內容 (最多5000字符)</Label>
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="輸入您想要轉換成語音的文字..."
                      rows={6}
                      className="resize-none"
                      maxLength={5000}
                    />
                    <p className="text-xs text-muted-foreground text-right">{text.length}/5000</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>語言</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {languages.map((lang) => (
                            <SelectItem key={lang.id} value={lang.id}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>聲音</Label>
                      <Select value={voice} onValueChange={setVoice}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {voices.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>模型</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="turbo">Turbo 快速, 40種語言</SelectItem>
                        <SelectItem value="hd">HD 高品質</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Voice Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">語音設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>語速: {speed[0].toFixed(1)}x</Label>
                    <Slider
                      value={speed}
                      onValueChange={setSpeed}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>音量: {volumeLevel[0].toFixed(1)}</Label>
                    <Slider
                      value={volumeLevel}
                      onValueChange={setVolumeLevel}
                      min={0.1}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>音調: {pitch[0]}</Label>
                    <Slider
                      value={pitch}
                      onValueChange={setPitch}
                      min={-12}
                      max={12}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>情感</Label>
                    <Select value={emotion} onValueChange={setEmotion}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {emotions.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="text-norm">文字標準化 (改善數字讀音)</Label>
                    <Switch
                      id="text-norm"
                      checked={textNormalization}
                      onCheckedChange={setTextNormalization}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Audio Settings & Player */}
            <div className="space-y-6">
              {/* Audio Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">音頻設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>採樣率</Label>
                    <Select value={sampleRate} onValueChange={setSampleRate}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sampleRates.map((sr) => (
                          <SelectItem key={sr.id} value={sr.id.toString()}>
                            {sr.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>位元率</Label>
                    <Select value={bitrate} onValueChange={setBitrate}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {bitrates.map((br) => (
                          <SelectItem key={br.id} value={br.id.toString()}>
                            {br.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>格式</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formats.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Player */}
              <Card>
                <CardHeader>
                  <CardTitle>播放器</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                      <Volume2 className="w-12 h-12 opacity-50" />
                    </div>
                    
                    {audioUrl ? (
                      <div className="flex items-center gap-4">
                        <Button size="lg" onClick={handlePlay}>
                          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                        </Button>
                        <Button size="lg" variant="outline" onClick={handleDownload}>
                          <Download className="w-6 h-6" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p>輸入文字並生成語音</p>
                        <p className="text-sm mt-1">支援40種語言和多種語音風格</p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !text.trim()}
                className="w-full gap-2"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-5 h-5" />
                    語音生成
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">語音歷史</h2>
            <div className="flex items-center gap-2">
              <Label htmlFor="favorites-only" className="text-sm">只顯示收藏項目</Label>
              <Switch
                id="favorites-only"
                checked={showFavoritesOnly}
                onCheckedChange={setShowFavoritesOnly}
              />
            </div>
          </div>

          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Volume2 className="w-12 h-12 mb-4 opacity-50" />
                <p>{showFavoritesOnly ? '沒有收藏的項目' : '還沒有語音歷史記錄'}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredHistory.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2 mb-2">{item.text_content}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="bg-muted px-2 py-0.5 rounded">{item.voice_name}</span>
                          <span className="bg-muted px-2 py-0.5 rounded">{languages.find(l => l.id === item.language)?.label}</span>
                          <span className="bg-muted px-2 py-0.5 rounded">{item.model === 'hd' ? 'HD' : 'Turbo'}</span>
                          <span>{new Date(item.created_at).toLocaleDateString('zh-TW')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleFavorite(item.id, item.is_favorite)}
                        >
                          <Star className={`w-4 h-4 ${item.is_favorite ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => loadFromHistory(item)}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteHistoryItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VoiceGenerationPage;
