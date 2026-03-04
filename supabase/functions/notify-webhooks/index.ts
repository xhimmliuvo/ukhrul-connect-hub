import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const body = await req.json()
    const { order_id, status, event_type = 'order_status_changed' } = body

    if (!order_id || !status) {
      return new Response(JSON.stringify({ error: 'order_id and status required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get active webhooks that subscribe to this event
    const { data: webhooks } = await supabase
      .from('api_webhooks')
      .select('id, url, secret, events')
      .eq('active', true)

    if (!webhooks || webhooks.length === 0) {
      return new Response(JSON.stringify({ message: 'No active webhooks' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const relevantWebhooks = webhooks.filter(w =>
      w.events?.includes(event_type)
    )

    const results = await Promise.allSettled(
      relevantWebhooks.map(async (webhook) => {
        const payload = {
          event: event_type,
          order_id,
          status,
          timestamp: new Date().toISOString(),
        }

        // Create HMAC signature
        const encoder = new TextEncoder()
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(webhook.secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        )
        const signature = await crypto.subtle.sign(
          'HMAC',
          key,
          encoder.encode(JSON.stringify(payload))
        )
        const signatureHex = Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signatureHex,
          },
          body: JSON.stringify(payload),
        })

        return { webhook_id: webhook.id, status: response.status }
      })
    )

    return new Response(JSON.stringify({
      message: `Notified ${relevantWebhooks.length} webhooks`,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { error: 'failed' })
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
