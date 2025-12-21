const AIToolsPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-display text-2xl mb-1">AI 工具</h1>
          <p className="text-muted-foreground">使用 AI 生成創意內容</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-muted-foreground mb-2">AI 工具功能即將推出</p>
        <p className="text-sm text-muted-foreground">
          您將可以在這裡使用 AI 生成社交媒體帖子、視頻腳本等內容。
        </p>
      </div>
    </div>
  );
};

export default AIToolsPage;
