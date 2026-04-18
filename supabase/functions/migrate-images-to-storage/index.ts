// One-shot backfill: convert all base64 image_url rows in generated_images
// into objects in the public 'generated-images' bucket and replace the column
// with the small public URL. Idempotent — skips rows already migrated.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    let migrated = 0;
    let failed = 0;
    let skipped = 0;
    const batchSize = 20;

    while (true) {
      // Pull a batch of rows still containing data: URLs
      const { data: rows, error } = await admin
        .from("generated_images")
        .select("id, user_id, image_url")
        .like("image_url", "data:image/%")
        .limit(batchSize);

      if (error) throw error;
      if (!rows || rows.length === 0) break;

      for (const row of rows) {
        try {
          const match = row.image_url.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
          if (!match) { skipped++; continue; }
          const mimeType = match[1];
          const ext = mimeType.split("/")[1].split("+")[0] || "png";
          const binary = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));

          const path = `${row.user_id}/${row.id}.${ext}`;
          const { error: upErr } = await admin.storage
            .from("generated-images")
            .upload(path, binary, { contentType: mimeType, upsert: true });
          if (upErr) throw upErr;

          const { data: pub } = admin.storage.from("generated-images").getPublicUrl(path);

          const { error: updErr } = await admin
            .from("generated_images")
            .update({ image_url: pub.publicUrl })
            .eq("id", row.id);
          if (updErr) throw updErr;

          migrated++;
        } catch (e) {
          console.error(`Row ${row.id} failed:`, e);
          failed++;
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, migrated, failed, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
