# Clover 自媒體管理平台 - 完整功能建置提示詞

這份文件包含了建置 Clover 平台所有功能的完整提示詞，可重複使用於類似專案。

---

## 目錄

1. [專案初始化](#1-專案初始化)
2. [用戶認證系統](#2-用戶認證系統)
3. [儀表板框架](#3-儀表板框架)
4. [AI 內容工具](#4-ai-內容工具)
5. [自媒體工具](#5-自媒體工具)
6. [發佈工具](#6-發佈工具)
7. [資料庫設計](#7-資料庫設計)

---

## 1. 專案初始化

### 提示詞：建立專案基礎結構

```
建立一個名為 "Clover" 的自媒體管理平台，包含：

1. 現代化的 Landing Page：
   - 響應式導航欄（桌面/手機）
   - Hero 區塊，帶有吸引人的標題和 CTA 按鈕
   - 功能展示區塊
   - 定價區塊
   - FAQ 區塊
   - 客戶見證區塊
   - 頁尾

2. 設計風格：
   - 主色調使用綠色系（品牌色）
   - 現代化、簡潔的 UI
   - 使用 Tailwind CSS 和 shadcn/ui 組件
   - 深色/淺色模式支援

3. 技術棧：
   - React + TypeScript
   - Vite
   - Tailwind CSS
   - shadcn/ui
   - React Router
```

---

## 2. 用戶認證系統

### 提示詞：建立完整認證流程

```
建立完整的用戶認證系統：

1. 認證頁面 (/auth)：
   - 登入表單（郵箱 + 密碼）
   - 註冊表單（郵箱 + 密碼 + 確認密碼）
   - 登入/註冊切換
   - 表單驗證
   - 錯誤處理和提示

2. 資料庫設計：
   - profiles 表：存儲用戶額外資訊
   - 自動建立 profile 的觸發器
   - RLS 政策保護用戶資料

3. 功能需求：
   - 啟用郵箱自動確認（開發環境）
   - 登入後重定向到儀表板
   - 受保護的路由
   - 登出功能
```

### SQL 遷移：用戶 Profile

```sql
-- 建立 profiles 表
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 啟用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS 政策
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 自動建立 profile 觸發器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 3. 儀表板框架

### 提示詞：建立儀表板佈局

```
建立儀表板框架：

1. 側邊欄 (DashboardSidebar)：
   - 可折疊的選單群組
   - 圖標 + 文字導航項目
   - 當前頁面高亮顯示
   - 響應式設計（手機版抽屜式）

2. 頂部導航 (DashboardHeader)：
   - 用戶頭像和下拉選單
   - 登出按鈕
   - 通知圖標（可選）

3. 主要區域：
   - 儀表板首頁統計卡片
   - 最近活動列表
   - 快速操作按鈕

4. 選單結構：
   - 首頁
   - AI 內容工具（可折疊群組）
     - AI 文案創作
     - 圖片生成
     - 語音生成
     - 語音轉字幕
     - 視頻生成
     - LipSync 影片
   - 自媒體工具（可折疊群組）
     - 提示詞管理
     - YouTube 搜尋
     - 小紅書搜尋
     - RSS 訂閱
   - 發佈工具（可折疊群組）
     - 內容整理
     - 貼圖製作器
     - 智能內容發布
     - 排程發布
   - 媒體庫
   - 設定
```

---

## 4. AI 內容工具

### 4.1 AI 文案創作

#### 提示詞：

```
建立 AI 文案創作功能：

1. 頁面功能：
   - 文案類型選擇（社交媒體貼文、文章、廣告文案等）
   - 平台選擇（Instagram、Facebook、小紅書等）
   - 語調選擇（專業、親切、幽默等）
   - 提示詞輸入框
   - 生成按鈕
   - 結果顯示區域（支援複製）
   - 歷史記錄

2. Edge Function (generate-content)：
   - 使用 Lovable AI Gateway
   - 根據類型和平台調整系統提示
   - 支援多語言輸出
```

#### Edge Function 代碼：

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, type, platform, tone } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `你是專業的社交媒體文案撰寫專家。
類型：${type || "社交媒體貼文"}
平台：${platform || "通用"}
語調：${tone || "專業友善"}
請根據用戶需求生成吸引人的文案。`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
      }),
    });

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ generatedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 4.2 圖片生成

#### 提示詞：

```
建立 AI 圖片生成功能：

1. 頁面功能：
   - 提示詞輸入框
   - 風格選擇（寫實、動漫、插畫、3D等）
   - 尺寸選擇（1:1、16:9、9:16等）
   - 生成按鈕
   - 圖片預覽
   - 下載按鈕
   - 歷史記錄畫廊

2. Edge Function (generate-image)：
   - 使用 Lovable AI Gateway 的圖片生成模型
   - 返回 base64 圖片數據
```

#### Edge Function 代碼：

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, style } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const enhancedPrompt = style 
      ? `${prompt}, ${style} style, high quality, detailed`
      : `${prompt}, high quality, detailed`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{ role: "user", content: enhancedPrompt }],
        modalities: ["image", "text"]
      }),
    });

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 4.3 語音生成

#### 提示詞：

```
建立語音生成功能（需要 ElevenLabs API）：

1. 頁面功能：
   - 文字輸入框
   - 語音選擇（不同聲音角色）
   - 語言選擇
   - 語速調整滑桿
   - 生成按鈕
   - 音頻播放器
   - 下載按鈕

2. 整合方式：
   - 使用 ElevenLabs Connector 或自訂 API Key
   - Edge Function 處理 API 請求
```

### 4.4 語音轉字幕

#### 提示詞：

```
建立語音轉字幕功能：

1. 頁面功能：
   - 音頻/視頻文件上傳
   - 語言選擇
   - 轉換按鈕
   - 字幕預覽
   - 時間軸編輯器（可選）
   - 導出格式選擇（SRT、VTT、TXT）
   - 下載按鈕

2. 整合方式：
   - 可使用 OpenAI Whisper API
   - 或第三方語音識別服務
```

### 4.5 視頻生成

#### 提示詞：

```
建立視頻生成功能：

1. 頁面功能：
   - 提示詞輸入框
   - 風格選擇
   - 時長選擇
   - 生成按鈕
   - 視頻預覽播放器
   - 下載按鈕

2. 整合方式：
   - 可整合 Runway、Pika Labs 等視頻生成 API
   - 需要相應的 API Key
```

### 4.6 LipSync 影片

#### 提示詞：

```
建立 LipSync 影片功能：

1. 頁面功能：
   - 視頻上傳
   - 音頻上傳或文字輸入
   - 生成按鈕
   - 結果預覽
   - 下載按鈕

2. 整合方式：
   - 可整合 Sync Labs、D-ID 等 LipSync API
   - 需要相應的 API Key
```

---

## 5. 自媒體工具

### 5.1 提示詞管理

#### 提示詞：

```
建立提示詞管理功能：

1. 頁面功能：
   - 提示詞列表（卡片式或表格式）
   - 新增提示詞對話框
   - 編輯提示詞
   - 刪除提示詞
   - 分類篩選
   - 搜尋功能
   - 收藏功能
   - 標籤系統
   - 一鍵複製

2. 資料結構：
   - id, title, content, category, tags[], is_favorite, user_id
```

#### SQL 遷移：

```sql
CREATE TABLE public.prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own prompts" 
ON public.prompts FOR ALL 
USING (auth.uid() = user_id);
```

### 5.2 YouTube 搜尋

#### 提示詞：

```
建立 YouTube 搜尋功能：

1. 頁面功能：
   - 搜尋輸入框
   - 結果數量選擇
   - 搜尋按鈕
   - 結果列表：
     - 縮圖
     - 標題
     - 頻道名稱
     - 觀看次數
     - 發布時間
     - 時長
   - 點擊可開啟 YouTube 連結

2. Edge Function：
   - 使用 AI 生成模擬搜尋結果
   - 或整合 YouTube Data API
```

#### Edge Function 代碼：

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, maxResults = 10 } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `You are a YouTube content research assistant. Return a JSON array of ${maxResults} hypothetical trending YouTube videos matching the search. Each object: title, channel, views, duration, publishedAt, description. Return ONLY valid JSON array.` 
          },
          { role: "user", content: `Search: ${query}` }
        ],
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    let results = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) results = JSON.parse(jsonMatch[0]);
    } catch (e) {
      results = [];
    }

    return new Response(
      JSON.stringify({ results, query }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 5.3 小紅書搜尋

#### 提示詞：

```
建立小紅書搜尋功能：

1. 頁面功能：
   - 搜尋輸入框
   - 結果數量選擇
   - 搜尋按鈕
   - 結果列表：
     - 標題
     - 作者
     - 點贊數
     - 評論數
     - 發布時間
     - 標籤
     - 內容摘要

2. Edge Function：
   - 使用 AI 生成模擬小紅書熱門內容
   - 返回中文內容
```

### 5.4 RSS 訂閱

#### 提示詞：

```
建立 RSS 訂閱管理功能：

1. 頁面功能：
   - RSS URL 輸入框
   - 添加訂閱按鈕
   - 訂閱列表
   - 文章列表：
     - 標題
     - 摘要
     - 發布時間
     - 來源
   - 刪除訂閱
   - 重新整理

2. Edge Function (rss-fetch)：
   - 解析 RSS/Atom XML
   - 提取文章列表
   - 處理 CORS
```

#### Edge Function 代碼：

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'User-Agent': 'Clover RSS Reader/1.0'
      }
    });

    const xmlText = await response.text();
    
    // 解析 XML 提取文章
    const items = [];
    const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);
    
    for (const match of itemMatches) {
      const itemXml = match[1];
      const getTag = (tag) => {
        const tagMatch = itemXml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
        return tagMatch ? (tagMatch[1] || tagMatch[2] || '').trim() : '';
      };
      
      items.push({
        title: getTag('title'),
        link: getTag('link'),
        description: getTag('description').replace(/<[^>]*>/g, '').substring(0, 200),
        pubDate: getTag('pubDate'),
        author: getTag('author') || getTag('dc:creator'),
      });
    }

    return new Response(
      JSON.stringify({ items: items.slice(0, 20) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

## 6. 發佈工具

### 6.1 內容整理

#### 提示詞：

```
建立 AI 內容整理功能：

1. 頁面功能：
   - 內容輸入框（支援貼上大量文字）
   - 整理類型選擇：
     - 摘要
     - 重點整理
     - 翻譯
     - 改寫
     - 擴展
   - 輸出語言選擇
   - 整理按鈕
   - 結果顯示
   - 複製按鈕

2. Edge Function (ai-organize)：
   - 根據選擇的類型調整 AI 提示
   - 支援多語言
```

### 6.2 貼圖製作器

#### 提示詞：

```
建立貼圖製作器功能：

1. 頁面功能：
   - 表情描述輸入
   - 風格選擇（可愛、搞笑、酷炫等）
   - 背景選擇（透明、純色）
   - 生成按鈕
   - 貼圖預覽網格
   - 下載單個/全部

2. Edge Function (sticker-generate)：
   - 使用 AI 圖片生成
   - 生成適合貼圖的正方形圖片
   - 可選透明背景
```

### 6.3 智能內容發布

#### 提示詞：

```
建立智能內容發布功能：

1. 頁面功能：
   - 內容輸入
   - 平台選擇（多選）
   - AI 優化建議
   - 最佳發布時間推薦
   - 預覽各平台效果
   - 發布/排程按鈕

2. 功能特色：
   - 根據平台特性調整內容長度
   - 自動生成 hashtag
   - 預覽不同平台的顯示效果
```

### 6.4 排程發布

#### 提示詞：

```
建立排程發布功能：

1. 頁面功能：
   - 日曆視圖
   - 新增排程對話框
   - 排程列表
   - 編輯/刪除排程
   - 狀態顯示（待發布、已發布、失敗）

2. 資料結構：
   - id, title, content, platform, scheduled_at, status, media_urls[], user_id
```

#### SQL 遷移：

```sql
CREATE TABLE public.scheduled_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  platform TEXT DEFAULT 'general',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending',
  media_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own scheduled posts" 
ON public.scheduled_posts FOR ALL 
USING (auth.uid() = user_id);
```

---

## 7. 資料庫設計

### 完整資料庫架構

```sql
-- 用戶 Profile
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 提示詞
CREATE TABLE public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI 生成記錄
CREATE TABLE public.ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tool_type TEXT DEFAULT 'content',
  prompt TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 媒體文件
CREATE TABLE public.media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 排程發布
CREATE TABLE public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  platform TEXT DEFAULT 'general',
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  media_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 為所有表啟用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

-- RLS 政策（用戶只能訪問自己的資料）
CREATE POLICY "Users own data" ON public.profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON public.prompts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON public.ai_generations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON public.media_files FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON public.scheduled_posts FOR ALL USING (auth.uid() = user_id);
```

---

## 8. Edge Functions 配置

### supabase/config.toml

```toml
project_id = "your-project-id"

[functions.generate-content]
verify_jwt = false

[functions.generate-image]
verify_jwt = false

[functions.youtube-search]
verify_jwt = false

[functions.xiaohongshu-search]
verify_jwt = false

[functions.rss-fetch]
verify_jwt = false

[functions.ai-organize]
verify_jwt = false

[functions.sticker-generate]
verify_jwt = false
```

---

## 9. 第三方 API 整合選項

如需完整功能，可整合以下 API：

| 功能 | 推薦 API | 用途 |
|------|----------|------|
| 語音生成 | ElevenLabs | 高品質 TTS |
| 語音轉文字 | OpenAI Whisper | 語音識別 |
| 視頻生成 | Runway ML, Pika Labs | AI 視頻 |
| LipSync | Sync Labs, D-ID | 口型同步 |
| YouTube 數據 | YouTube Data API | 真實搜尋 |
| 社交發布 | Buffer API, Later API | 自動發布 |

---

## 10. 快速部署檢查清單

- [ ] 資料庫表格已建立
- [ ] RLS 政策已配置
- [ ] Edge Functions 已部署
- [ ] 認證功能已測試
- [ ] 所有頁面路由已配置
- [ ] 響應式設計已驗證
- [ ] 錯誤處理已完善
- [ ] Loading 狀態已加入

---

*此文件由 Lovable AI 生成，可用於重建 Clover 自媒體管理平台的所有功能。*
