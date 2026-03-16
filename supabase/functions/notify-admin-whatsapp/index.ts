import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ADMIN_PHONE = '917005498122'; // Without + prefix for WhatsApp API

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { order_type, order_id, details } = await req.json()

    // Use CallMeBot WhatsApp API (free, no setup needed)
    const message = encodeURIComponent(
      `🔔 *New ${order_type === 'delivery' ? 'Delivery' : 'Dropee'} Order*\n\n` +
      `📦 Order ID: ${order_id}\n` +
      `${details}\n` +
      `⏰ ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`
    )

    const apiKey = Deno.env.get('CALLMEBOT_API_KEY')
    if (!apiKey) {
      console.error('CALLMEBOT_API_KEY not configured')
      return new Response(JSON.stringify({ error: 'WhatsApp API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const whatsappUrl = `https://api.callmebot.com/whatsapp.php?phone=${ADMIN_PHONE}&text=${message}&apikey=${apiKey}`

    const response = await fetch(whatsappUrl)
    const responseText = await response.text()

    console.log('WhatsApp API response:', response.status, responseText)

    return new Response(JSON.stringify({ success: true, status: response.status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('WhatsApp notification error:', err)
    return new Response(JSON.stringify({ error: 'Failed to send WhatsApp notification' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
