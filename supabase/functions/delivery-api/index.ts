import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  try {
    // GET endpoints
    if (req.method === 'GET') {
      if (action === 'track') {
        const orderId = url.searchParams.get('order_id')
        if (!orderId) {
          return new Response(JSON.stringify({ error: 'order_id required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { data: order, error } = await supabase
          .from('delivery_orders')
          .select('id, status, pickup_address, delivery_address, assigned_agent_id, created_at, updated_at, estimated_delivery_time, pickup_time, delivery_time')
          .eq('id', orderId)
          .single()

        if (error || !order) {
          return new Response(JSON.stringify({ error: 'Order not found' }), {
            status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Get latest tracking data
        const { data: tracking } = await supabase
          .from('delivery_tracking')
          .select('lat, lng, heading, speed, status, timestamp')
          .eq('order_id', orderId)
          .order('timestamp', { ascending: false })
          .limit(1)

        return new Response(JSON.stringify({
          order,
          tracking: tracking?.[0] || null
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (action === 'status') {
        const orderId = url.searchParams.get('order_id')
        if (!orderId) {
          return new Response(JSON.stringify({ error: 'order_id required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { data, error } = await supabase
          .from('delivery_orders')
          .select('id, status, updated_at')
          .eq('id', orderId)
          .single()

        if (error || !data) {
          return new Response(JSON.stringify({ error: 'Order not found' }), {
            status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ error: 'Invalid action. Use: track, status' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST endpoints
    if (req.method === 'POST') {
      const body = await req.json()

      if (body.action === 'webhook_register') {
        if (!body.url) {
          return new Response(JSON.stringify({ error: 'url is required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { data, error } = await supabase
          .from('api_webhooks')
          .insert({
            url: body.url,
            events: body.events || ['order_status_changed'],
          })
          .select('id, secret, events')
          .single()

        if (error) {
          return new Response(JSON.stringify({ error: 'Failed to register webhook' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        return new Response(JSON.stringify({
          message: 'Webhook registered successfully',
          webhook_id: data.id,
          secret: data.secret,
          events: data.events,
        }), {
          status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
