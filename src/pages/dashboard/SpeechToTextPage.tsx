import { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, Download, FileAudio, FileVideo, Trash2, Check, Languages, History, Subtitles, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface VoiceGeneration {
  id: string;
  voice_name: string;
  audio_url: string | null;
  text_content: string;
  created_at: string;
}

interface SubtitleConversion {
  id: string;
  source_name: string;
  source_type: string;
  languages: string[];
  status: string;
  subtitle_urls: Record<string, string>;
  created_at: string;
}

const SUPPORTED_LANGUAGES = [
  { id: 'zh-TW', label: '繁體中文（書面語）' },
  { id: 'zh-CN', label: '簡體中文（書面語）' },
  { id: 'en', label: '英文' },
  { id: 'ja', label: '日文' },
  { id: 'ko', label: '韓文' },
];

const AUDIO_FORMATS = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/x-m4a'];
const VIDEO_FORMATS = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
const ACCEPTED_FORMATS = [...AUDIO_FORMATS, ...VIDEO_FORMATS].join(',');

const SpeechToTextPage = () => {
  const [activeTab, setActiveTab] = useState('convert');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceGenerations, setVoiceGenerations] = useState<VoiceGeneration[]>([]);
  const [conversions, setConversions] = useState<SubtitleConversion[]>([]);
  const [selectedVoiceGeneration, setSelectedVoiceGeneration] = useState<string | null>(null);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch voice generations for library selection
  useEffect(() => {
    const fetchVoiceGenerations = async () => {
      setIsLoadingVoices(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

    fetchVoiceGenerations();
  }, []);

  // Fetch conversion history
  useEffect(() => {
    if (activeTab === 'history') {
      fetchConversions();
    }
  }, [activeTab]);

  const fetchConversions = async () => {
    setIsLoadingHistory(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('subtitle_conversions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setConversions(data as SubtitleConversion[]);
    }
    setIsLoadingHistory(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Clear voice generation selection when file is uploaded
      setSelectedVoiceGeneration(null);
      setUploadedFile(file);
      toast({ title: '檔案已上傳', description: file.name });
    }
  };

  const handleLanguageToggle = (langId: string) => {
    setSelectedLanguages(prev =>
      prev.includes(langId)
        ? prev.filter(l => l !== langId)
        : [...prev, langId]
    );
  };

  const handleVoiceGenerationSelect = (id: string) => {
    // Clear file upload when voice is selected
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSelectedVoiceGeneration(prev => prev === id ? null : id);
  };

  const handleStartConversion = async () => {
    if (selectedLanguages.length === 0) {
      toast({ title: '請選擇至少一種語言', variant: 'destructive' });
      return;
    }

    if (!uploadedFile && !selectedVoiceGeneration) {
      toast({ title: '請上傳檔案或選擇語音', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('請先登入');

      let sourceName = '';
      let sourceType = 'upload';
      let sourceUrl = '';

      if (uploadedFile) {
        sourceName = uploadedFile.name;
        sourceType = 'upload';
        // Upload file to storage
        const filePath = `${user.id}/${Date.now()}-${uploadedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, uploadedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
        sourceUrl = urlData.publicUrl;
      } else if (selectedVoiceGeneration) {
        const voice = voiceGenerations.find(v => v.id === selectedVoiceGeneration);
        if (voice) {
          sourceName = voice.voice_name || voice.text_content.substring(0, 30);
          sourceType = 'voice_library';
          sourceUrl = voice.audio_url || '';
        }
      }

      // Create conversion record
      const { data: conversion, error: conversionError } = await supabase
        .from('subtitle_conversions')
        .insert({
          user_id: user.id,
          source_name: sourceName,
          source_type: sourceType,
          source_url: sourceUrl,
          languages: selectedLanguages,
          status: 'processing',
        })
        .select()
        .single();

      if (conversionError) throw conversionError;

      // Call edge function to process
      const { data, error } = await supabase.functions.invoke('audio-to-subtitle', {
        body: {
          conversionId: conversion.id,
          sourceUrl: sourceUrl,
          languages: selectedLanguages,
        },
      });

      if (error) throw error;

      toast({ title: '轉換成功', description: '字幕檔案已生成' });
      
      // Reset form
      setUploadedFile(null);
      setSelectedVoiceGeneration(null);
      setSelectedLanguages([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh history
      fetchConversions();
      setActiveTab('history');
    } catch (error) {
      console.error('Conversion error:', error);
      toast({ 
        title: '轉換失敗', 
        description: error instanceof Error ? error.message : '請稍後再試',
        variant: 'destructive' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteConversion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subtitle_conversions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConversions(prev => prev.filter(c => c.id !== id));
      toast({ title: '已刪除' });
    } catch (error) {
      toast({ title: '刪除失敗', variant: 'destructive' });
    }
  };

  const handleDownloadSubtitle = (url: string, language: string, sourceName: string) => {
    const langLabel = SUPPORTED_LANGUAGES.find(l => l.id === language)?.label || language;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sourceName}-${langLabel}.srt`;
    a.click();
  };

  const getFileTypeIcon = (file: File | null) => {
    if (!file) return FileAudio;
    return VIDEO_FORMATS.includes(file.type) ? FileVideo : FileAudio;
  };

  const FileIcon = uploadedFile ? getFileTypeIcon(uploadedFile) : FileAudio;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="heading-display text-2xl mb-1">音頻/視頻轉字幕</h1>
        <p className="text-muted-foreground">將音頻或視頻檔案自動轉換為 SRT 字幕檔案</p>
      </div>

      {/* Credits display */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-3">
          <p className="text-sm">
            <span className="font-medium text-primary">點數消耗：1 點/語言</span>
            <span className="text-muted-foreground ml-2">（每種輸出語言消耗 1 點）</span>
          </p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="convert" className="gap-2">
            <Subtitles className="w-4 h-4" />
            轉換字幕
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            轉換記錄
          </TabsTrigger>
        </TabsList>

        <TabsContent value="convert" className="mt-6 space-y-6">
          {/* Source Selection */}
          <Card>
            <CardHeader>
              <CardTitle>選擇音頻或視頻來源</CardTitle>
              <CardDescription>上傳音頻或視頻檔案，或從語音庫選擇</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              <div>
                <h4 className="font-medium mb-3">上傳音頻或視頻檔案</h4>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FORMATS}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    uploadedFile 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary'
                  }`}
                >
                  <FileIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  {uploadedFile ? (
                    <div className="space-y-1">
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        移除
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium mb-1">選擇檔案</p>
                      <p className="text-sm text-muted-foreground">
                        支援格式：音頻（MP3, WAV, M4A, AAC）、視頻（MP4, MOV, AVI, MKV, WebM）
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Video Library Selection - placeholder for future */}
              <div>
                <h4 className="font-medium mb-3">或從視頻庫選擇</h4>
                <Button variant="outline" className="w-full" disabled>
                  <FileVideo className="w-4 h-4 mr-2" />
                  從視頻庫選擇
                </Button>
                <p className="text-sm text-muted-foreground mt-2">（視頻庫功能即將推出）</p>
              </div>

              {/* Voice Library Selection */}
              <div>
                <h4 className="font-medium mb-3">或從語音庫選擇</h4>
                {isLoadingVoices ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : voiceGenerations.length > 0 ? (
                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    {voiceGenerations.map((voice) => (
                      <div
                        key={voice.id}
                        onClick={() => handleVoiceGenerationSelect(voice.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedVoiceGeneration === voice.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {selectedVoiceGeneration === voice.id && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{voice.voice_name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {voice.text_content.substring(0, 50)}...
                            </p>
                          </div>
                        </div>
                        {voice.audio_url && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const audio = new Audio(voice.audio_url!);
                              audio.play();
                            }}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    暫無語音記錄，請先使用語音生成功能
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Language Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5" />
                選擇輸出語言
              </CardTitle>
              <CardDescription>可選擇多種語言同時生成</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <div
                    key={lang.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedLanguages.includes(lang.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleLanguageToggle(lang.id)}
                  >
                    <Checkbox
                      id={lang.id}
                      checked={selectedLanguages.includes(lang.id)}
                      onCheckedChange={() => handleLanguageToggle(lang.id)}
                    />
                    <Label htmlFor={lang.id} className="cursor-pointer flex-1">
                      {lang.label}
                    </Label>
                  </div>
                ))}
              </div>
              
              {selectedLanguages.length === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-3">
                  請選擇至少一種語言
                </p>
              )}

              {selectedLanguages.length > 0 && (
                <p className="text-sm text-muted-foreground mt-3">
                  已選擇 {selectedLanguages.length} 種語言，預計消耗 {selectedLanguages.length} 點數
                </p>
              )}
            </CardContent>
          </Card>

          {/* Convert Button */}
          <Button
            onClick={handleStartConversion}
            disabled={isProcessing || selectedLanguages.length === 0 || (!uploadedFile && !selectedVoiceGeneration)}
            className="w-full h-12 text-lg gap-2"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                轉換中...
              </>
            ) : (
              <>
                <Subtitles className="w-5 h-5" />
                開始轉換
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>轉換記錄</CardTitle>
              <CardDescription>查看所有字幕轉換歷史</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : conversions.length > 0 ? (
                <div className="space-y-4">
                  {conversions.map((conversion) => (
                    <div
                      key={conversion.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{conversion.source_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(conversion.created_at), 'yyyy-MM-dd HH:mm')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            conversion.status === 'completed' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : conversion.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          }`}>
                            {conversion.status === 'completed' ? '已完成' : 
                             conversion.status === 'processing' ? '處理中' : '失敗'}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteConversion(conversion.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {conversion.status === 'completed' && conversion.subtitle_urls && (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(conversion.subtitle_urls).map(([lang, url]) => {
                            const langLabel = SUPPORTED_LANGUAGES.find(l => l.id === lang)?.label || lang;
                            return (
                              <Button
                                key={lang}
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadSubtitle(url as string, lang, conversion.source_name)}
                                className="gap-1"
                              >
                                <Download className="w-3 h-3" />
                                {langLabel}
                              </Button>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {conversion.languages.map((lang) => (
                          <span key={lang} className="text-xs bg-muted px-2 py-1 rounded">
                            {SUPPORTED_LANGUAGES.find(l => l.id === lang)?.label || lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>暫無轉換記錄</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpeechToTextPage;
