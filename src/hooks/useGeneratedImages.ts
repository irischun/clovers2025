import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GeneratedImage {
  id: string;
  user_id: string;
  prompt: string;
  image_url: string;
  title: string | null;
  is_avatar: boolean;
  is_favorite: boolean;
  style: string | null;
  model: string | null;
  aspect_ratio: string | null;
  created_at: string;
}

export function useGeneratedImages() {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchImages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setImages([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages((data as GeneratedImage[]) || []);
    } catch (error) {
      console.error('Error fetching generated images:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveImage = async (imageData: {
    prompt: string;
    image_url: string;
    title?: string;
    is_avatar?: boolean;
    style?: string;
    model?: string;
    aspect_ratio?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('generated_images')
        .insert({
          user_id: user.id,
          prompt: imageData.prompt,
          image_url: imageData.image_url,
          title: imageData.title || null,
          is_avatar: imageData.is_avatar || false,
          style: imageData.style || null,
          model: imageData.model || null,
          aspect_ratio: imageData.aspect_ratio || null,
        })
        .select()
        .single();

      if (error) throw error;

      setImages(prev => [(data as GeneratedImage), ...prev]);
      return data as GeneratedImage;
    } catch (error) {
      console.error('Error saving generated image:', error);
      throw error;
    }
  };

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('generated_images')
        .update({ is_favorite: !isFavorite })
        .eq('id', id);

      if (error) throw error;

      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, is_favorite: !isFavorite } : img
      ));
      
      toast({ title: !isFavorite ? '已添加到收藏' : '已取消收藏' });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({ title: '操作失敗', variant: 'destructive' });
    }
  };

  const deleteImage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('generated_images')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setImages(prev => prev.filter(img => img.id !== id));
      toast({ title: '圖片已刪除' });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({ title: '刪除失敗', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  return {
    images,
    loading,
    saveImage,
    toggleFavorite,
    deleteImage,
    refetch: fetchImages,
  };
}
