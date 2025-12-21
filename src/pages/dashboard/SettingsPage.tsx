const SettingsPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-display text-2xl mb-1">設定</h1>
          <p className="text-muted-foreground">管理您的帳戶和偏好設定</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-muted-foreground mb-2">設定頁面即將推出</p>
        <p className="text-sm text-muted-foreground">
          您將可以在這裡更新個人資料、更改密碼等。
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
