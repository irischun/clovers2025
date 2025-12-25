import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversionId, sourceUrl, languages } = await req.json();

    console.log('Audio to Subtitle conversion started:', { conversionId, sourceUrl, languages });

    if (!conversionId || !sourceUrl || !languages || languages.length === 0) {
      throw new Error('Missing required parameters: conversionId, sourceUrl, or languages');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For demo purposes, we'll generate mock SRT content
    // In production, this would call a speech-to-text API like OpenAI Whisper
    const generateMockSRT = (language: string) => {
      const languageNames: Record<string, string> = {
        'zh-TW': '繁體中文',
        'zh-CN': '简体中文',
        'en': 'English',
        'ja': '日本語',
        'ko': '한국어',
      };

      const sampleTexts: Record<string, string[]> = {
        'zh-TW': ['歡迎使用字幕轉換服務', '這是自動生成的字幕', '感謝您的使用'],
        'zh-CN': ['欢迎使用字幕转换服务', '这是自动生成的字幕', '感谢您的使用'],
        'en': ['Welcome to the subtitle conversion service', 'This is an auto-generated subtitle', 'Thank you for using our service'],
        'ja': ['字幕変換サービスへようこそ', 'これは自動生成された字幕です', 'ご利用ありがとうございます'],
        'ko': ['자막 변환 서비스에 오신 것을 환영합니다', '이것은 자동 생성된 자막입니다', '이용해 주셔서 감사합니다'],
      };

      const texts = sampleTexts[language] || sampleTexts['en'];
      
      let srt = '';
      texts.forEach((text, index) => {
        const startSeconds = index * 5;
        const endSeconds = startSeconds + 4;
        const startTime = formatSRTTime(startSeconds);
        const endTime = formatSRTTime(endSeconds);
        srt += `${index + 1}\n${startTime} --> ${endTime}\n${text}\n\n`;
      });

      return srt;
    };

    const formatSRTTime = (totalSeconds: number) => {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},000`;
    };

    // Generate subtitles for each language
    const subtitleUrls: Record<string, string> = {};

    for (const language of languages) {
      const srtContent = generateMockSRT(language);
      
      // Upload SRT file to storage
      const fileName = `subtitles/${conversionId}/${language}.srt`;
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, new Blob([srtContent], { type: 'text/plain' }), {
          contentType: 'text/plain',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error for language', language, uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);
      subtitleUrls[language] = urlData.publicUrl;
    }

    // Update conversion record with results
    const { error: updateError } = await supabase
      .from('subtitle_conversions')
      .update({
        status: 'completed',
        subtitle_urls: subtitleUrls,
      })
      .eq('id', conversionId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    console.log('Conversion completed successfully:', { conversionId, subtitleUrls });

    return new Response(
      JSON.stringify({ 
        success: true, 
        subtitleUrls,
        message: 'Subtitles generated successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in audio-to-subtitle function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
