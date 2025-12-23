import { useState, useRef } from 'react';
import { Mic, MicOff, Upload, Loader2, Copy, Download, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const SpeechToTextPage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      toast({ title: '開始錄音', description: '請說話...' });
      
      // In a real implementation, this would use the Web Speech API or similar
      setTimeout(() => {
        setIsRecording(false);
        setTranscription('這是一段示範文字。語音轉文字功能需要連接語音識別 API（如 OpenAI Whisper 或 Google Speech-to-Text）。');
      }, 3000);
    } catch (error) {
      toast({ title: '無法訪問麥克風', variant: 'destructive' });
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    toast({ title: '錄音結束' });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast({ title: '文件已上傳', description: file.name });
    }
  };

  const handleProcessFile = async () => {
    if (!uploadedFile) return;
    
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setTranscription('這是上傳音頻文件的轉錄結果。此功能需要連接語音識別 API 來處理實際的音頻文件。');
      setIsProcessing(false);
      toast({ title: '轉錄完成' });
    }, 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcription);
    toast({ title: '已複製到剪貼板' });
  };

  const handleDownload = () => {
    const blob = new Blob([transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcription.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="heading-display text-2xl mb-1">語音轉字幕</h1>
        <p className="text-muted-foreground">將語音或音頻文件轉換為文字</p>
      </div>

      <Tabs defaultValue="record">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="record" className="gap-2">
            <Mic className="w-4 h-4" />
            即時錄音
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="w-4 h-4" />
            上傳文件
          </TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>錄音</CardTitle>
                <CardDescription>點擊開始錄音，再次點擊停止</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                    isRecording 
                      ? 'bg-destructive text-destructive-foreground animate-pulse' 
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-12 h-12" />
                  ) : (
                    <Mic className="w-12 h-12" />
                  )}
                </button>
                <p className="mt-6 text-muted-foreground">
                  {isRecording ? '錄音中... 點擊停止' : '點擊開始錄音'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>轉錄結果</CardTitle>
                  {transcription && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleCopy}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleDownload}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {transcription ? (
                  <div className="bg-muted/50 rounded-lg p-4 min-h-[200px] whitespace-pre-wrap">
                    {transcription}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <Mic className="w-12 h-12 mb-4 opacity-50" />
                    <p>開始錄音後，轉錄結果將顯示在這裡</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>上傳音頻文件</CardTitle>
                <CardDescription>支援 MP3, WAV, M4A, OGG 格式</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  <FileAudio className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  {uploadedFile ? (
                    <p className="text-sm">{uploadedFile.name}</p>
                  ) : (
                    <>
                      <p className="text-muted-foreground">點擊或拖放文件到這裡</p>
                      <p className="text-sm text-muted-foreground mt-1">最大 100MB</p>
                    </>
                  )}
                </div>

                <Button 
                  onClick={handleProcessFile} 
                  disabled={!uploadedFile || isProcessing}
                  className="w-full gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      處理中...
                    </>
                  ) : (
                    '開始轉錄'
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>轉錄結果</CardTitle>
                  {transcription && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleCopy}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleDownload}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {transcription ? (
                  <div className="bg-muted/50 rounded-lg p-4 min-h-[200px] whitespace-pre-wrap">
                    {transcription}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <FileAudio className="w-12 h-12 mb-4 opacity-50" />
                    <p>上傳文件後，轉錄結果將顯示在這裡</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpeechToTextPage;
