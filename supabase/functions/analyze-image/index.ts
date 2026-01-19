import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyAuth(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getClaims(token);
  
  if (error || !data?.claims) {
    return null;
  }

  return { userId: data.claims.sub as string };
}

// Build the analysis prompt
function buildAnalysisPrompt(): string {
  return `Analyze this image thoroughly and provide detailed descriptions of any people AND animals visible. 

## For each PERSON detected, identify:
1. **Gender**: Perceived gender (male, female, or ambiguous)
2. **Estimated Age Range**: Approximate age group (child, teenager, young adult 20-30, adult 30-45, middle-aged 45-60, senior 60+)
3. **Ethnicity/Race**: Perceived ethnic background (e.g., East Asian, South Asian, Caucasian/European, African/Black, Middle Eastern, Latino/Hispanic, Mixed, etc.)
4. **Facial Features**:
   - Face shape (oval, round, square, heart, oblong)
   - Eye characteristics (shape, size, color if visible)
   - Nose type (straight, curved, wide, narrow)
   - Lip shape (thin, full, medium)
   - Eyebrow style (thick, thin, arched, straight)
   - Any distinctive features (dimples, freckles, beauty marks, etc.)
5. **Hair**: Color and style
6. **Expression**: Current facial expression or mood
7. **Skin Characteristics**: Skin tone, texture
8. **Body Type**: If visible (slim, athletic, average, plus-size, etc.)
9. **Attire/Style**: Clothing style and accessories
10. **Overall Vibe**: General impression or personality conveyed

## For each ANIMAL detected, identify:
1. **Species**: Specific animal species (e.g., Golden Retriever dog, Persian cat, African elephant)
2. **Breed/Subspecies**: If applicable and identifiable
3. **Age Estimate**: Baby/juvenile, young adult, adult, senior
4. **Size**: Small, medium, large, or specific size description
5. **Color/Markings**: Fur/skin color, patterns, distinctive markings
6. **Coat/Texture**: Fur type (short, long, curly, smooth), feather type, scales, etc.
7. **Physical Features**:
   - Body shape and build
   - Ear shape and position
   - Eye color and shape
   - Tail characteristics
   - Any distinctive features (spots, stripes, scars, etc.)
8. **Expression/Mood**: Apparent emotional state (happy, alert, relaxed, playful, scared, etc.)
9. **Pose/Activity**: What the animal is doing (sitting, running, sleeping, etc.)
10. **Accessories**: Collars, harnesses, clothing, tags, etc.
11. **Health Appearance**: General health indicators (healthy coat, body condition)
12. **Overall Character**: Personality impression (friendly, majestic, cute, fierce, etc.)

## Scene Context:
- Describe the overall scene and environment
- Note any interaction between people and animals if both are present

Respond in this JSON format:
{
  "peopleDetected": true/false,
  "numberOfPeople": number,
  "animalsDetected": true/false,
  "numberOfAnimals": number,
  "subjects": [
    {
      "type": "person",
      "gender": "string",
      "ageRange": "string",
      "ethnicity": "string",
      "faceShape": "string",
      "eyeFeatures": "string",
      "noseType": "string",
      "lipShape": "string",
      "eyebrows": "string",
      "distinctiveFeatures": "string",
      "hairColor": "string",
      "hairStyle": "string",
      "expression": "string",
      "skinTone": "string",
      "bodyType": "string",
      "attire": "string",
      "overallVibe": "string",
      "descriptionPrompt": "A detailed text description suitable for image generation prompts"
    }
  ],
  "animals": [
    {
      "type": "animal",
      "species": "string",
      "breed": "string",
      "ageEstimate": "string",
      "size": "string",
      "colorMarkings": "string",
      "coatTexture": "string",
      "bodyShape": "string",
      "earShape": "string",
      "eyeColor": "string",
      "tailFeatures": "string",
      "distinctiveFeatures": "string",
      "expression": "string",
      "pose": "string",
      "accessories": "string",
      "healthAppearance": "string",
      "overallCharacter": "string",
      "descriptionPrompt": "A detailed text description suitable for image generation prompts"
    }
  ],
  "sceneDescription": "Overall scene description including environment and any interactions",
  "suggestedPromptAdditions": "Suggested text to add to image generation prompts to maintain consistency with detected subjects"
}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (!auth) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { imageUrl, imageBase64 } = await req.json();
    
    if (!imageUrl && !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image provided. Please provide imageUrl or imageBase64.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Image analysis request from user:", auth.userId);

    // Prepare the image URL for the API
    const imageContent = imageBase64 
      ? (imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`)
      : imageUrl;

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
            role: "user",
            content: [
              { type: "text", text: buildAnalysisPrompt() },
              { type: "image_url", image_url: { url: imageContent } }
            ]
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Image analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content;

    if (!textContent) {
      console.error("No analysis content in response");
      return new Response(
        JSON.stringify({ error: "No analysis generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to parse JSON from the response
    let analysisResult;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                        textContent.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, textContent];
      const jsonStr = jsonMatch[1] || textContent;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.log("Could not parse JSON, returning raw text analysis");
      analysisResult = {
        rawAnalysis: textContent,
        parseError: true
      };
    }

    console.log("Image analysis completed successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis: analysisResult 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
