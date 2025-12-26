import { useState } from 'react';
import { Send, Loader2, Search, RefreshCw, CheckCircle, XCircle, Clock, FileText, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePublishingHistory } from '@/hooks/usePublishingHistory';
import { format } from 'date-fns';

const platforms = [
  { id: 'facebook', label: 'Facebook', icon: '📘' },
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'twitter', label: 'X (Twitter)', icon: '🐦' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'threads', label: 'Threads', icon: '🧵' },
  { id: 'xiaohongshu', label: '小紅書', icon: '📕' },
];

const SmartPublishPage = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [otherPlatform, setOtherPlatform] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const { records, loading, refetch, addRecord } = usePublishingHistory();

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const selectAllPlatforms = () => {
    if (selectedPlatforms.length === platforms.length) {
      setSelectedPlatforms([]);
    } else {
      setSelectedPlatforms(platforms.map(p => p.id));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!content.trim()) { 
      toast({ title: '請輸入內容', variant: 'destructive' }); 
      return; 
    }
    if (selectedPlatforms.length === 0 && !otherPlatform.trim()) { 
      toast({ title: '請選擇至少一個平台', variant: 'destructive' }); 
      return; 
    }
    
    setIsPublishing(true);
    
    try {
      // Simulate publishing to each platform
      const platformsToPublish = [...selectedPlatforms];
      if (otherPlatform.trim()) {
        platformsToPublish.push(otherPlatform);
      }

      for (const platform of platformsToPublish) {
        await addRecord({
          title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          content: content,
          platform: platform,
          status: 'completed',
          published_url: null,
          image_url: null,
        });
      }

      toast({ 
        title: '發布成功', 
        description: `內容已發布到 ${platformsToPublish.length} 個平台` 
      });
      
      setContent('');
      setSelectedPlatforms([]);
      setOtherPlatform('');
      setUploadedFiles([]);
      refetch();
    } catch (error) {
      toast({ 
        title: '發布失敗', 
        description: '請稍後再試',
        variant: 'destructive' 
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = searchQuery === '' || 
      record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />已完成</Badge>;
      case 'ready':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Clock className="w-3 h-3 mr-1" />已就緒</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />失敗</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="heading-display text-2xl">智能內容發布</h1>
            <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">Beta</Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            上傳任意格式文件，AI 自動提取內容、智能重寫、生成配圖，一鍵發布至多個社交平台
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            創建內容
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            歷史記錄
          </TabsTrigger>
        </TabsList>

        {/* Create Content Tab */}
        <TabsContent value="create" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Content Input */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>發布內容</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">上傳任意格式文件，AI 自動提取內容</p>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span className="cursor-pointer">選擇文件</span>
                    </Button>
                  </label>
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFile(index)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Textarea 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  placeholder="輸入要發布的內容..." 
                  rows={8}
                  className="resize-none"
                />

                {/* Preview Section */}
                {content && (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      預覽
                    </h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handlePublish} 
                  disabled={isPublishing || (!content.trim() && uploadedFiles.length === 0)} 
                  className="w-full"
                  size="lg"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      發布中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      發布到選定平台
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Platform Selection */}
            <Card>
              <CardHeader>
                <CardTitle>選擇平台</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Select All */}
                <label 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer border-b border-border pb-4 mb-2"
                  onClick={selectAllPlatforms}
                >
                  <Checkbox 
                    checked={selectedPlatforms.length === platforms.length}
                    onCheckedChange={selectAllPlatforms}
                  />
                  <span className="font-medium">全部</span>
                </label>

                {/* Individual Platforms */}
                {platforms.map(p => (
                  <label 
                    key={p.id} 
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer"
                  >
                    <Checkbox 
                      checked={selectedPlatforms.includes(p.id)} 
                      onCheckedChange={() => togglePlatform(p.id)} 
                    />
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </label>
                ))}

                {/* Other Platform */}
                <div className="pt-3 border-t border-border">
                  <label className="text-sm font-medium mb-2 block">其他平台：</label>
                  <Input 
                    placeholder="輸入平台名稱..."
                    value={otherPlatform}
                    onChange={(e) => setOtherPlatform(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6 mt-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜尋檔案名稱或標題..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="全部狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="ready">已就緒</SelectItem>
                <SelectItem value="failed">失敗</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={refetch} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              重新整理
            </Button>
          </div>

          {/* History List */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>尚無發布記錄</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredRecords.map((record) => (
                    <div key={record.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{record.title}</h4>
                            {getStatusBadge(record.status)}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{record.content}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {platforms.find(p => p.id === record.platform)?.icon || '📱'} 
                              {platforms.find(p => p.id === record.platform)?.label || record.platform}
                            </span>
                            <span>{format(new Date(record.created_at), 'yyyy-MM-dd HH:mm')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartPublishPage;
