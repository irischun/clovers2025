import { useState, useRef } from 'react';
import PointsBalanceCard from '@/components/dashboard/PointsBalanceCard';
import { Upload, Image as ImageIcon, Video, File, Trash2, Download, Search, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useMediaFiles } from '@/hooks/useMediaFiles';
import { useToast } from '@/hooks/use-toast';

const MediaPage = () => {
  const { files, loading, uploadFile, deleteFile, getPublicUrl } = useMediaFiles();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(selectedFiles)) {
        if (file.size > 50 * 1024 * 1024) {
          toast({ title: `${file.name} 超過 50MB 限制`, variant: 'destructive' });
          continue;
        }
        await uploadFile(file);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(droppedFiles)) {
        if (file.size > 50 * 1024 * 1024) {
          toast({ title: `${file.name} 超過 50MB 限制`, variant: 'destructive' });
          continue;
        }
        await uploadFile(file);
      }
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-8 h-8" />;
    if (type.startsWith('video/')) return <Video className="w-8 h-8" />;
    return <File className="w-8 h-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (type: string) => type.startsWith('image/');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Points Balance */}
      <PointsBalanceCard />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-display text-2xl mb-1">媒體庫</h1>
          <p className="text-muted-foreground">管理您的圖片和視頻檔案</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
          <Upload className="w-4 h-4" />
          {uploading ? '上傳中...' : '上傳檔案'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">拖放檔案到這裡或點擊上傳</p>
        <p className="text-sm text-muted-foreground mt-1">支援圖片和視頻，最大 50MB</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜尋檔案..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Files */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className={viewMode === 'grid' ? 'aspect-square bg-muted rounded-lg mb-3' : 'h-12 bg-muted rounded-lg'}></div>
              {viewMode === 'grid' && <div className="h-4 bg-muted rounded w-3/4"></div>}
            </div>
          ))}
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-2">
            {files.length === 0 ? '還沒有上傳任何檔案' : '沒有找到匹配的檔案'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map(file => (
            <div 
              key={file.id} 
              className="bg-card border border-border rounded-xl overflow-hidden group hover:border-primary/50 transition-colors"
            >
              <div 
                className="aspect-square bg-muted flex items-center justify-center cursor-pointer relative"
                onClick={() => isImage(file.file_type) && setSelectedImage(getPublicUrl(file.file_path))}
              >
                {isImage(file.file_type) ? (
                  <img 
                    src={getPublicUrl(file.file_path)} 
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getFileIcon(file.file_type)
                )}
                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" asChild>
                    <a href={getPublicUrl(file.file_path)} download={file.name} target="_blank">
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => deleteFile(file.id, file.file_path)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map(file => (
            <div 
              key={file.id} 
              className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 group hover:border-primary/50 transition-colors"
            >
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                {isImage(file.file_type) ? (
                  <img 
                    src={getPublicUrl(file.file_path)} 
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getFileIcon(file.file_type)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">{formatFileSize(file.file_size)}</p>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" asChild>
                  <a href={getPublicUrl(file.file_path)} download={file.name} target="_blank">
                    <Download className="w-4 h-4" />
                  </a>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => deleteFile(file.id, file.file_path)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-2 bg-background">
          {selectedImage && (
            <img src={selectedImage} alt="Preview" className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaPage;
