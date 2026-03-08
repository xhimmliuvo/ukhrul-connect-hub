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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hubUrl = Deno.env.get("HUB_URL")!;
    const hubApiKey = Deno.env.get("HUB_API_KEY")!;

    // Verify user
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Parse request
    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch order using service role (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: order, error: orderError } = await supabaseAdmin
      .from("delivery_orders")
      .select("*")
      .eq("id", order_id)
      .eq("user_id", userId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Forward to hub
    const hubPayload = {
      source: "ukhrul",
      internal_order_id: order.id,
      customer_name: order.delivery_contact_name,
      customer_phone: order.delivery_contact_phone,
      pickup_address: order.pickup_address,
      delivery_address: order.delivery_address,
      pickup_contact_name: order.pickup_contact_name,
      pickup_contact_phone: order.pickup_contact_phone,
      package_description: order.package_description,
      weight_kg: order.weight_kg,
      is_fragile: order.is_fragile,
      total_fee: order.agent_adjusted_fee || order.total_fee,
      notes: order.delivery_notes,
      urgency: order.urgency,
    };

    let hubOrderId: string | null = null;

    try {
      const hubResponse = await fetch(`${hubUrl}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": hubApiKey,
        },
        body: JSON.stringify(hubPayload),
      });

      if (hubResponse.ok) {
        const hubData = await hubResponse.json();
        hubOrderId = hubData.order_id || hubData.id || null;
      } else {
        const errorText = await hubResponse.text();
        console.error("Hub API error:", hubResponse.status, errorText);
        // Don't fail the whole request — hub forwarding is additive
      }
    } catch (hubError) {
      console.error("Hub connection error:", hubError);
      // Don't fail — order still works locally
    }

    // Save hub_order_id back to DB
    if (hubOrderId) {
      await supabaseAdmin
        .from("delivery_orders")
        .update({ hub_order_id: hubOrderId, hub_status: "pending" })
        .eq("id", order_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        hub_order_id: hubOrderId,
        message: hubOrderId
          ? "Order forwarded to hub"
          : "Hub forwarding failed, order continues locally",
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
