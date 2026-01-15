import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PricingRequest {
  service_id?: string;
  distance_km: number;
  weight_kg: number;
  is_fragile: boolean;
  weather_condition: 'clear' | 'rain' | 'heavy_rain';
  urgency: 'normal' | 'urgent' | 'scheduled';
}

interface PricingBreakdown {
  base_fee: number;
  distance_fee: number;
  weight_fee: number;
  fragile_fee: number;
  weather_fee: number;
  urgency_fee: number;
  total_fee: number;
  breakdown: {
    label: string;
    amount: number;
  }[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: PricingRequest = await req.json();
    const { 
      service_id, 
      distance_km, 
      weight_kg, 
      is_fragile, 
      weather_condition, 
      urgency 
    } = body;

    // Validate inputs
    if (distance_km === undefined || distance_km < 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid distance_km' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch pricing configuration
    let pricingQuery = supabase
      .from('delivery_pricing')
      .select('*');

    if (service_id) {
      pricingQuery = pricingQuery.eq('service_id', service_id);
    }

    const { data: pricingData, error: pricingError } = await pricingQuery.limit(1).maybeSingle();

    // Use default pricing if no specific pricing found
    const pricing = pricingData || {
      base_price: 30,
      price_per_km: 10,
      price_per_kg: 5,
      fragile_multiplier: 1.5,
      rain_multiplier: 1.3,
      urgent_multiplier: 1.5,
      min_fee: 30,
      max_fee: 500,
    };

    // Calculate fees
    const base_fee = pricing.base_price;
    const distance_fee = distance_km * pricing.price_per_km;
    
    // Weight fee only applies for packages over 2kg
    const weight_fee = weight_kg > 2 ? (weight_kg - 2) * pricing.price_per_kg : 0;
    
    // Fragile fee is a multiplier on base
    const fragile_fee = is_fragile ? base_fee * (pricing.fragile_multiplier - 1) : 0;
    
    // Weather fee
    let weather_fee = 0;
    if (weather_condition === 'rain') {
      weather_fee = base_fee * (pricing.rain_multiplier - 1);
    } else if (weather_condition === 'heavy_rain') {
      weather_fee = base_fee * (pricing.rain_multiplier - 1) * 1.5;
    }
    
    // Urgency fee
    const urgency_fee = urgency === 'urgent' ? base_fee * (pricing.urgent_multiplier - 1) : 0;

    // Calculate total with min/max bounds
    let total_fee = base_fee + distance_fee + weight_fee + fragile_fee + weather_fee + urgency_fee;
    total_fee = Math.max(pricing.min_fee, Math.min(pricing.max_fee, total_fee));

    // Round all values
    const round = (n: number) => Math.round(n * 100) / 100;

    const breakdown: PricingBreakdown['breakdown'] = [
      { label: 'Base Fee', amount: round(base_fee) },
      { label: `Distance (${distance_km.toFixed(1)} km)`, amount: round(distance_fee) },
    ];

    if (weight_fee > 0) {
      breakdown.push({ label: `Weight (${weight_kg} kg)`, amount: round(weight_fee) });
    }
    if (fragile_fee > 0) {
      breakdown.push({ label: 'Fragile Handling', amount: round(fragile_fee) });
    }
    if (weather_fee > 0) {
      breakdown.push({ label: `Weather (${weather_condition})`, amount: round(weather_fee) });
    }
    if (urgency_fee > 0) {
      breakdown.push({ label: 'Urgent Delivery', amount: round(urgency_fee) });
    }

    const result: PricingBreakdown = {
      base_fee: round(base_fee),
      distance_fee: round(distance_fee),
      weight_fee: round(weight_fee),
      fragile_fee: round(fragile_fee),
      weather_fee: round(weather_fee),
      urgency_fee: round(urgency_fee),
      total_fee: round(total_fee),
      breakdown,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error calculating fee:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to calculate fee' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
