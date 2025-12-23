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
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: "RSS URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching RSS from:", url);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'User-Agent': 'Clover RSS Reader/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status}`);
    }

    const xmlText = await response.text();
    
    // Parse XML to extract items
    const items: Array<{
      title: string;
      link: string;
      description: string;
      pubDate: string;
      author?: string;
    }> = [];
    
    // Simple XML parsing for RSS items
    const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);
    
    for (const match of itemMatches) {
      const itemXml = match[1];
      
      const getTag = (tag: string) => {
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

    // Get feed info
    const titleMatch = xmlText.match(/<channel>[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    const descMatch = xmlText.match(/<channel>[\s\S]*?<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
    
    return new Response(
      JSON.stringify({
        feed: {
          title: titleMatch?.[1]?.trim() || 'Unknown Feed',
          description: descMatch?.[1]?.trim() || '',
          url: url
        },
        items: items.slice(0, 20)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("rss-fetch error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
