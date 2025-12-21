import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type ContentType = 'social' | 'video' | 'blog' | 'email';

export function useAIGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const { toast } = useToast();

  const generateContent = async (prompt: string, type: ContentType = 'social') => {
    setIsGenerating(true);
    setGeneratedContent('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt, type }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast({ title: '請求過於頻繁，請稍後再試', variant: 'destructive' });
          return '';
        }
        if (response.status === 402) {
          toast({ title: 'AI 額度已用完，請充值', variant: 'destructive' });
          return '';
        }
        throw new Error('Generation failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullContent = '';

      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setGeneratedContent(fullContent);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Save to history
      const { data: { user } } = await supabase.auth.getUser();
      if (user && fullContent) {
        await supabase.from('ai_generations').insert({
          user_id: user.id,
          prompt,
          result: fullContent,
          tool_type: type,
        });
      }

      return fullContent;
    } catch (error) {
      console.error('AI generation error:', error);
      toast({ title: '內容生成失敗', variant: 'destructive' });
      return '';
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateContent,
    isGenerating,
    generatedContent,
    setGeneratedContent,
  };
}
