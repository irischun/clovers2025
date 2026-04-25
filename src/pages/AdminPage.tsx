import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trash2, Upload, ShieldCheck, ArrowLeft, Home } from 'lucide-react';
import Navigation from '@/components/Navigation';
import {
  ADMIN_EMAIL,
  AdminUploadCategory,
  useAdminUploads,
  useDeleteAdminUpload,
  useUploadAdminMedia,
} from '@/hooks/useAdminUploads';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';

const AdminPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeCategory, setActiveCategory] = useState<AdminUploadCategory>('manga');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');

  const { data: uploads = [], isLoading } = useAdminUploads();
  const uploadMutation = useUploadAdminMedia();
  const deleteMutation = useDeleteAdminUpload();

  const CATEGORIES: { key: AdminUploadCategory; label: string }[] = [
    { key: 'manga', label: t('admin.cat.manga') },
    { key: 'cover', label: t('admin.cat.cover') },
    { key: 'product', label: t('admin.cat.product') },
  ];

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      if (user.email !== ADMIN_EMAIL) {
        toast({ title: t('admin.accessDenied'), description: t('admin.adminOnly'), variant: 'destructive' });
        navigate('/main');
        return;
      }
      setIsAdmin(true);
      setAuthChecked(true);
    };
    check();
  }, [navigate, toast, t]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: t('admin.selectFile'), variant: 'destructive' });
      return;
    }
    await uploadMutation.mutateAsync({ file, category: activeCategory, title: title || undefined });
    setFile(null);
    setTitle('');
    const input = document.getElementById('admin-file-input') as HTMLInputElement | null;
    if (input) input.value = '';
  };

  if (!authChecked || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('admin.verifying')}</p>
      </div>
    );
  }

  const itemsForCategory = uploads.filter((u) => u.category === activeCategory);
  const activeLabel = CATEGORIES.find((c) => c.key === activeCategory)?.label ?? '';

  return (
    <>
      <Helmet>
        <title>{t('admin.pageTitle')}</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <Button variant="ghost" size="sm" onClick={() => navigate('/main')} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> {t('admin.back')}
            </Button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <h1 className="font-heading text-3xl font-bold">{t('admin.heading')}</h1>
            </div>
            <Button
              onClick={() => navigate('/main')}
              className="ml-auto gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg hover:shadow-primary/30 rounded-xl"
              aria-label={t('admin.goHome')}
            >
              <Home className="w-4 h-4" />
              {t('admin.goHome')}
            </Button>
          </div>

          <p className="text-muted-foreground mb-8">{t('admin.intro')}</p>

          <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as AdminUploadCategory)}>
            <TabsList className="mb-6">
              {CATEGORIES.map((c) => (
                <TabsTrigger key={c.key} value={c.key}>{c.label}</TabsTrigger>
              ))}
            </TabsList>

            {CATEGORIES.map((c) => (
              <TabsContent key={c.key} value={c.key} className="space-y-8">
                <Card className="p-6">
                  <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                      <Label htmlFor="admin-file-input">{t('admin.fileLabel')}</Label>
                      <Input
                        id="admin-file-input"
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-title">{t('admin.titleLabel')}</Label>
                      <Input
                        id="admin-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t('admin.titlePlaceholder')}
                      />
                    </div>
                    <Button type="submit" disabled={uploadMutation.isPending} className="gap-2">
                      <Upload className="w-4 h-4" />
                      {uploadMutation.isPending
                        ? t('admin.uploading')
                        : t('admin.uploadTo', { category: c.label })}
                    </Button>
                  </form>
                </Card>

                <div>
                  <h2 className="font-heading text-xl font-semibold mb-4">
                    {t('admin.existing', { category: activeLabel, count: itemsForCategory.length })}
                  </h2>
                  {isLoading ? (
                    <p className="text-muted-foreground">{t('admin.loading')}</p>
                  ) : itemsForCategory.length === 0 ? (
                    <p className="text-muted-foreground">{t('admin.noUploads')}</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {itemsForCategory.map((item) => (
                        <Card key={item.id} className="overflow-hidden group relative">
                          <div className="aspect-square bg-muted">
                            {item.media_type === 'video' ? (
                              <video src={item.media_url} className="w-full h-full object-cover" muted controls />
                            ) : (
                              <img src={item.media_url} alt={item.title ?? ''} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="p-2">
                            <p className="text-xs truncate" title={item.title ?? ''}>{item.title}</p>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full mt-2 gap-1"
                              disabled={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(item)}
                            >
                              <Trash2 className="w-3 h-3" /> {t('admin.delete')}
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>
    </>
  );
};

export default AdminPage;
