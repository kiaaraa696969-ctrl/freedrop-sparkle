const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: setting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "discord_webhook_url")
    .maybeSingle();

  const webhookUrl = setting?.value;
  if (!webhookUrl) {
    return new Response(JSON.stringify({ error: "Discord webhook not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { title, category, imageUrl, accountUrl } = await req.json();

    const embed = {
      title: `🎁 New Drop: ${title}`,
      description: `Category: **${category}**\n\n[Claim Now](${accountUrl})`,
      color: 0x7c3aed,
      ...(imageUrl ? { thumbnail: { url: imageUrl } } : {}),
      timestamp: new Date().toISOString(),
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
