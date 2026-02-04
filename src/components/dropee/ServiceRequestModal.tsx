import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Truck, 
  Loader2, 
  MapPin, 
  Package, 
  User, 
  Phone,
  CloudRain,
  AlertTriangle,
  Zap,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Ticket,
  Info
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DropeeService {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface DeliveryAgent {
  id: string;
  agent_code: string;
  full_name: string;
  avatar_url: string | null;
  vehicle_type: string;
  rating: number | null;
  agent_availability: { status: string } | null;
}

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: DropeeService;
  preferredAgentId?: string;
}

interface PricingBreakdown {
  base_fee: number;
  distance_fee: number;
  weight_fee: number;
  fragile_fee: number;
  weather_fee: number;
  urgency_fee: number;
  total_fee: number;
  breakdown: { label: string; amount: number }[];
}

const STEPS = ['Service', 'Pickup', 'Delivery', 'Package', 'Agent', 'Confirm'];

export function ServiceRequestModal({ 
  isOpen, 
  onClose, 
  service,
  preferredAgentId 
}: ServiceRequestModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [services, setServices] = useState<DropeeService[]>([]);
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  
  // Form state
  const [selectedServiceId, setSelectedServiceId] = useState(service?.id || '');
  
  // Pickup
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupContactName, setPickupContactName] = useState('');
  const [pickupContactPhone, setPickupContactPhone] = useState('');
  
  // Delivery
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryContactName, setDeliveryContactName] = useState('');
  const [deliveryContactPhone, setDeliveryContactPhone] = useState('');
  
  // Package
  const [packageDescription, setPackageDescription] = useState('');
  const [weightKg, setWeightKg] = useState(1);
  const [isFragile, setIsFragile] = useState(false);
  
  // Conditions
  const [weatherCondition, setWeatherCondition] = useState<'clear' | 'rain' | 'heavy_rain'>('clear');
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'scheduled'>('normal');
  
  // Agent selection
  const [selectedAgentId, setSelectedAgentId] = useState(preferredAgentId || '');
  
  // Pricing
  const [estimatedDistance, setEstimatedDistance] = useState(3); // Default 3km
  const [pricingBreakdown, setPricingBreakdown] = useState<PricingBreakdown | null>(null);
  
  // Promo code
  const [promoCode, setPromoCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchServices();
      fetchAgents();
      if (service) setSelectedServiceId(service.id);
      if (preferredAgentId) setSelectedAgentId(preferredAgentId);
    }
  }, [isOpen, service, preferredAgentId]);

  useEffect(() => {
    // Calculate fee when relevant inputs change
    if (currentStep >= 3) {
      calculateFee();
    }
  }, [estimatedDistance, weightKg, isFragile, weatherCondition, urgency, selectedServiceId]);

  async function fetchServices() {
    const { data } = await supabase
      .from('dropee_services')
      .select('id, name, slug, icon')
      .eq('active', true)
      .order('display_order');
    setServices(data || []);
  }

  async function fetchAgents() {
    const { data } = await supabase
      .from('delivery_agents')
      .select(`
        id, agent_code, full_name, avatar_url, vehicle_type, rating,
        agent_availability (status)
      `)
      .eq('is_active', true)
      .eq('is_verified', true)
      .order('rating', { ascending: false });
    
    // Sort by availability
    const sorted = (data || []).sort((a, b) => {
      const order: Record<string, number> = { online: 0, busy: 1, offline: 2 };
      const statusA = a.agent_availability?.status || 'offline';
      const statusB = b.agent_availability?.status || 'offline';
      return (order[statusA] || 2) - (order[statusB] || 2);
    });
    
    setAgents(sorted as DeliveryAgent[]);
  }

  async function calculateFee() {
    setCalculatingFee(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-delivery-fee', {
        body: {
          service_id: selectedServiceId || undefined,
          distance_km: estimatedDistance,
          weight_kg: weightKg,
          is_fragile: isFragile,
          weather_condition: weatherCondition,
          urgency,
        },
      });
      
      if (error) throw error;
      setPricingBreakdown(data);
    } catch (err) {
      console.error('Failed to calculate fee:', err);
    } finally {
      setCalculatingFee(false);
    }
  }

  async function handleSubmit() {
    if (!user) {
      toast.error('Please log in to place an order');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('delivery_orders').insert({
        user_id: user.id,
        service_id: selectedServiceId || null,
        pickup_address: pickupAddress,
        pickup_contact_name: pickupContactName,
        pickup_contact_phone: pickupContactPhone,
        delivery_address: deliveryAddress,
        delivery_contact_name: deliveryContactName,
        delivery_contact_phone: deliveryContactPhone,
        package_description: packageDescription,
        weight_kg: weightKg,
        is_fragile: isFragile,
        weather_condition: weatherCondition,
        urgency,
        distance_km: estimatedDistance,
        base_fee: pricingBreakdown?.base_fee,
        distance_fee: pricingBreakdown?.distance_fee,
        weight_fee: pricingBreakdown?.weight_fee,
        fragile_fee: pricingBreakdown?.fragile_fee,
        weather_fee: pricingBreakdown?.weather_fee,
        urgency_fee: pricingBreakdown?.urgency_fee,
        total_fee: pricingBreakdown?.total_fee,
        preferred_agent_id: selectedAgentId || null,
        promo_code: promoCode || null,
      });

      if (error) throw error;

      toast.success('Order placed successfully!', {
        description: 'An agent will be assigned shortly.',
      });
      onClose();
    } catch (err: any) {
      toast.error('Failed to place order', { description: err.message });
    } finally {
      setLoading(false);
    }
  }

  function canProceed() {
    switch (currentStep) {
      case 0: return !!selectedServiceId;
      case 1: return pickupAddress && pickupContactName && pickupContactPhone;
      case 2: return deliveryAddress && deliveryContactName && deliveryContactPhone;
      case 3: return weightKg > 0;
      case 4: return true; // Agent selection is optional
      case 5: return true; // Allow placing order even without pricing - admin will confirm
      default: return true;
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Select Service Type</h3>
            <div className="grid grid-cols-2 gap-3">
              {services.map((s) => (
                <Card
                  key={s.id}
                  className={`cursor-pointer transition-all ${
                    selectedServiceId === s.id
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedServiceId(s.id)}
                >
                  <CardContent className="p-4 text-center">
                    <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-medium text-sm">{s.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <MapPin className="h-5 w-5" />
              <h3 className="font-medium">Pickup Location</h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Pickup Address *</Label>
                <Textarea
                  placeholder="Enter full pickup address..."
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Contact Name *</Label>
                  <Input
                    placeholder="Name"
                    value={pickupContactName}
                    onChange={(e) => setPickupContactName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    placeholder="Phone number"
                    value={pickupContactPhone}
                    onChange={(e) => setPickupContactPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <MapPin className="h-5 w-5" />
              <h3 className="font-medium">Delivery Location</h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Delivery Address *</Label>
                <Textarea
                  placeholder="Enter full delivery address..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Contact Name *</Label>
                  <Input
                    placeholder="Name"
                    value={deliveryContactName}
                    onChange={(e) => setDeliveryContactName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    placeholder="Phone number"
                    value={deliveryContactPhone}
                    onChange={(e) => setDeliveryContactPhone(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Estimated Distance (km)</Label>
                <Input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={estimatedDistance}
                  onChange={(e) => setEstimatedDistance(parseFloat(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Agent will verify and adjust if needed
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Package className="h-5 w-5" />
              <h3 className="font-medium">Package Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Package Description</Label>
                <Textarea
                  placeholder="What are you sending?"
                  value={packageDescription}
                  onChange={(e) => setPackageDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 1)}
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fragile"
                      checked={isFragile}
                      onCheckedChange={(c) => setIsFragile(!!c)}
                    />
                    <Label htmlFor="fragile" className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Fragile
                    </Label>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="flex items-center gap-1">
                    <CloudRain className="h-4 w-4" />
                    Weather
                  </Label>
                  <Select value={weatherCondition} onValueChange={(v) => setWeatherCondition(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clear">Clear</SelectItem>
                      <SelectItem value="rain">Light Rain</SelectItem>
                      <SelectItem value="heavy_rain">Heavy Rain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    Urgency
                  </Label>
                  <Select value={urgency} onValueChange={(v) => setUrgency(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="urgent">Urgent (+50%)</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <User className="h-5 w-5" />
              <h3 className="font-medium">Preferred Agent (Optional)</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Select a preferred agent or skip to let us assign the best available one.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <Card
                className={`cursor-pointer transition-all ${
                  !selectedAgentId ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedAgentId('')}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Auto-assign</p>
                    <p className="text-xs text-muted-foreground">Best available agent</p>
                  </div>
                </CardContent>
              </Card>
              
              {agents.filter(a => a.agent_availability?.status === 'online').map((agent) => (
                <Card
                  key={agent.id}
                  className={`cursor-pointer transition-all ${
                    selectedAgentId === agent.id
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedAgentId(agent.id)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {agent.full_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{agent.full_name}</p>
                        <Badge variant="outline" className="text-xs">{agent.agent_code}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ★ {agent.rating?.toFixed(1) || '0.0'} • {agent.vehicle_type}
                      </p>
                    </div>
                    <span className="h-3 w-3 rounded-full bg-green-500" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Calculator className="h-5 w-5" />
              <h3 className="font-medium">Order Summary</h3>
            </div>
            
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pickup</span>
                  <span className="font-medium text-right max-w-[60%] truncate">{pickupAddress}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium text-right max-w-[60%] truncate">{deliveryAddress}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Distance</span>
                  <span className="font-medium">{estimatedDistance} km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Weight</span>
                  <span className="font-medium">{weightKg} kg</span>
                </div>
                {isFragile && (
                  <Badge variant="outline" className="text-yellow-600">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Fragile
                  </Badge>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 space-y-2">
                <h4 className="font-semibold text-foreground mb-3">Fee Breakdown (Estimate)</h4>
                {calculatingFee ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculating...
                  </div>
                ) : pricingBreakdown ? (
                  <>
                    {pricingBreakdown.breakdown.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span>₹{item.amount}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Estimated Total</span>
                      <span className="text-primary">₹{pricingBreakdown.total_fee}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">Fee will be provided by admin/agent</p>
                )}
              </CardContent>
            </Card>

            {/* Promo/Coupon Code */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Ticket className="h-4 w-4 text-primary" />
                  Promo/Coupon Code (Optional)
                </Label>
                <Input
                  placeholder="Enter promo code..."
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Fee Notice */}
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-300 text-sm">
                This is an estimate only. Admin/Agent will confirm your final fee upon completion.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Request Dropee Delivery
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  i < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : i === currentStep
                    ? 'bg-primary/20 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-4 h-0.5 ${i < currentStep ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="min-h-[300px]">
          {renderStepContent()}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={() => setCurrentStep((s) => s + 1)} disabled={!canProceed()}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Truck className="h-4 w-4 mr-2" />
              )}
              Place Order
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
