import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hubUrl = Deno.env.get("HUB_URL")!;
    const hubApiKey = Deno.env.get("HUB_API_KEY")!;

    const { hub_order_id } = await req.json();
    if (!hub_order_id) {
      return new Response(JSON.stringify({ error: "hub_order_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call hub API to get status
    const hubResponse = await fetch(`${hubUrl}/api/orders/${hub_order_id}`, {
      method: "GET",
      headers: {
        "x-api-key": hubApiKey,
      },
    });

    if (!hubResponse.ok) {
      const errorText = await hubResponse.text();
      console.error("Hub status check error:", hubResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch hub status", hub_status: null }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const hubData = await hubResponse.json();

    // Update hub_status in our DB
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const hubStatus = hubData.status || hubData.hub_status || "pending";

    await supabaseAdmin
      .from("delivery_orders")
      .update({ hub_status: hubStatus })
      .eq("hub_order_id", hub_order_id);

    return new Response(
      JSON.stringify({
        hub_order_id,
        hub_status: hubStatus,
        data: hubData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
