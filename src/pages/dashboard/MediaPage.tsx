const MediaPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-display text-2xl mb-1">媒體庫</h1>
          <p className="text-muted-foreground">管理您的圖片和視頻檔案</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-muted-foreground mb-2">媒體庫功能即將推出</p>
        <p className="text-sm text-muted-foreground">
          您將可以在這裡上傳和管理您的媒體檔案。
        </p>
      </div>
    </div>
  );
};

export default MediaPage;
