import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Minus, Plus, Truck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
}

interface Package {
  id: string;
  name: string;
}

interface DropeeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: {
    id: string;
    name: string;
    business_type: string;
  };
  products?: Product[];
  packages?: Package[];
}

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export function DropeeOrderModal({ 
  isOpen, 
  onClose, 
  business, 
  products = [], 
  packages = [] 
}: DropeeOrderModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userContact, setUserContact] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  
  // Product order state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
  // Booking state (cafes, restaurants, hotels)
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [preferredTime, setPreferredTime] = useState('');
  const [numPeople, setNumPeople] = useState(2);
  const [numRooms, setNumRooms] = useState(1);
  
  // Agency state
  const [selectedPackage, setSelectedPackage] = useState('');
  const [travelDate, setTravelDate] = useState<Date>();

  const businessType = business.business_type;
  
  const getOrderType = () => {
    switch (businessType) {
      case 'cafe':
      case 'restaurant':
        return 'food';
      case 'hotel':
        return 'booking';
      case 'agency':
        return 'tour';
      default:
        return 'product';
    }
  };

  const updateQuantity = (product: Product, delta: number) => {
    setOrderItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          return prev.filter(item => item.productId !== product.id);
        }
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: newQty }
            : item
        );
      } else if (delta > 0) {
        return [...prev, {
          productId: product.id,
          name: product.name,
          price: product.discount_price || product.price,
          quantity: 1
        }];
      }
      return prev;
    });
  };

  const getQuantity = (productId: string) => {
    return orderItems.find(item => item.productId === productId)?.quantity || 0;
  };

  const getTotalAmount = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const buildOrderDetails = () => {
    switch (businessType) {
      case 'product':
        return {
          items: orderItems,
          totalAmount: getTotalAmount(),
          customNotes,
        };
      case 'cafe':
      case 'restaurant':
        return {
          items: orderItems,
          totalAmount: getTotalAmount(),
          preferredTime,
          customNotes,
        };
      case 'hotel':
        return {
          checkInDate: checkInDate ? format(checkInDate, 'yyyy-MM-dd') : null,
          checkOutDate: checkOutDate ? format(checkOutDate, 'yyyy-MM-dd') : null,
          numRooms,
          numGuests: numPeople,
          customNotes,
        };
      case 'agency':
        return {
          packageName: selectedPackage || 'Custom Request',
          travelDate: travelDate ? format(travelDate, 'yyyy-MM-dd') : null,
          numPeople,
          customNotes,
        };
      default:
        return { customNotes };
    }
  };

  const handleSubmit = async () => {
    if (!userContact.trim()) {
      toast({
        title: "Contact required",
        description: "Please enter your phone number or WhatsApp",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const orderPayload = {
        business_id: business.id,
        business_name: business.name,
        business_type: businessType,
        order_type: getOrderType(),
        details: buildOrderDetails(),
        user_contact: userContact,
        user_id: user?.id || null,
      };

      const { error } = await supabase
        .from('dropee_orders')
        .insert(orderPayload);

      if (error) throw error;

      toast({
        title: "Order Placed!",
        description: "HashtagDropee will contact you shortly to confirm your order.",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Order failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderProductForm = () => (
    <div className="space-y-4">
      {products.length > 0 ? (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div>
                <p className="font-medium text-sm">{product.name}</p>
                <p className="text-sm text-primary">
                  ₹{product.discount_price || product.price}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="h-8 w-8"
                  onClick={() => updateQuantity(product, -1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">
                  {getQuantity(product.id)}
                </span>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="h-8 w-8"
                  onClick={() => updateQuantity(product, 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No products listed. Use the custom order field below.
        </p>
      )}
      
      {orderItems.length > 0 && (
        <div className="p-3 bg-primary/10 rounded-lg">
          <p className="font-semibold">
            Total: ₹{getTotalAmount().toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );

  const renderFoodForm = () => (
    <div className="space-y-4">
      {renderProductForm()}
      
      <div className="space-y-2">
        <Label>Preferred Pickup/Delivery Time</Label>
        <Select value={preferredTime} onValueChange={setPreferredTime}>
          <SelectTrigger>
            <SelectValue placeholder="Select time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asap">As soon as possible</SelectItem>
            <SelectItem value="morning">Morning (9AM - 12PM)</SelectItem>
            <SelectItem value="afternoon">Afternoon (12PM - 4PM)</SelectItem>
            <SelectItem value="evening">Evening (4PM - 8PM)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderHotelForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Check-in Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !checkInDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkInDate ? format(checkInDate, "PP") : "Select"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={checkInDate}
                onSelect={setCheckInDate}
                disabled={(date) => date < new Date()}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label>Check-out Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !checkOutDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkOutDate ? format(checkOutDate, "PP") : "Select"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={checkOutDate}
                onSelect={setCheckOutDate}
                disabled={(date) => date < (checkInDate || new Date())}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Rooms</Label>
          <Input
            type="number"
            min={1}
            value={numRooms}
            onChange={(e) => setNumRooms(parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="space-y-2">
          <Label>Guests</Label>
          <Input
            type="number"
            min={1}
            value={numPeople}
            onChange={(e) => setNumPeople(parseInt(e.target.value) || 1)}
          />
        </div>
      </div>
    </div>
  );

  const renderAgencyForm = () => (
    <div className="space-y-4">
      {packages.length > 0 && (
        <div className="space-y-2">
          <Label>Select Package</Label>
          <Select value={selectedPackage} onValueChange={setSelectedPackage}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a package" />
            </SelectTrigger>
            <SelectContent>
              {packages.map((pkg) => (
                <SelectItem key={pkg.id} value={pkg.name}>
                  {pkg.name}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom Request</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="space-y-2">
        <Label>Travel Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !travelDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {travelDate ? format(travelDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={travelDate}
              onSelect={setTravelDate}
              disabled={(date) => date < new Date()}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="space-y-2">
        <Label>Number of People</Label>
        <Input
          type="number"
          min={1}
          value={numPeople}
          onChange={(e) => setNumPeople(parseInt(e.target.value) || 1)}
        />
      </div>
    </div>
  );

  const renderFormByType = () => {
    switch (businessType) {
      case 'cafe':
      case 'restaurant':
        return renderFoodForm();
      case 'hotel':
        return renderHotelForm();
      case 'agency':
        return renderAgencyForm();
      default:
        return renderProductForm();
    }
  };

  const getButtonText = () => {
    switch (businessType) {
      case 'cafe':
      case 'restaurant':
        return 'Order Food with #Dropee';
      case 'hotel':
        return 'Book Room with #Dropee';
      case 'agency':
        return 'Book Tour with #Dropee';
      default:
        return 'Place Order with #Dropee';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Order with #Dropee
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-medium text-foreground">{business.name}</p>
            <Badge variant="secondary" className="mt-1">
              {businessType}
            </Badge>
          </div>

          {renderFormByType()}

          <div className="space-y-2">
            <Label>Special Requests / Notes</Label>
            <Textarea
              placeholder="Any special instructions or requests..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Your Contact (Phone/WhatsApp) *</Label>
            <Input
              placeholder="Enter your phone number"
              value={userContact}
              onChange={(e) => setUserContact(e.target.value)}
            />
          </div>

          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Truck className="w-4 h-4 mr-2" />
            )}
            {getButtonText()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
