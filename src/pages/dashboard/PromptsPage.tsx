const PromptsPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-display text-2xl mb-1">提示詞庫</h1>
          <p className="text-muted-foreground">管理和組織您的 AI 提示詞</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-muted-foreground mb-2">提示詞庫功能即將推出</p>
        <p className="text-sm text-muted-foreground">
          您將可以在這裡創建、管理和分享您的 AI 提示詞。
        </p>
      </div>
    </div>
  );
};

export default PromptsPage;
