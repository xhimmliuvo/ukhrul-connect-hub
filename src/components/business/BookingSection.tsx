import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Clock, Users, BedDouble, Phone, MessageCircle, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingSectionProps {
  businessType: 'cafe' | 'restaurant' | 'hotel';
  onBookSlot: (booking: {
    date: Date;
    timeSlot: string;
    people: number;
    rooms?: number;
  }) => void;
  businessName?: string;
  businessPhone?: string | null;
  businessWhatsapp?: string | null;
  onBookViaDropee?: () => void;
}

const timeSlots = [
  { value: 'morning', label: 'Morning (8AM - 12PM)' },
  { value: 'afternoon', label: 'Afternoon (12PM - 4PM)' },
  { value: 'evening', label: 'Evening (4PM - 8PM)' },
  { value: 'night', label: 'Night (8PM - 11PM)' },
];

export function BookingSection({ businessType, onBookSlot, businessName = '', businessPhone = null, businessWhatsapp = null, onBookViaDropee }: BookingSectionProps) {
  const [date, setDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [people, setPeople] = useState<number>(2);
  const [rooms, setRooms] = useState<number>(1);

  const isHotel = businessType === 'hotel';

  const bookingText = () => {
    if (!date || !timeSlot) return '';
    const slotLabel = timeSlots.find(s => s.value === timeSlot)?.label || timeSlot;
    return `Hi ${businessName}, I'd like to ${isHotel ? 'book' : 'reserve'} for ${people} ${isHotel ? 'guests' : 'people'} on ${format(date, 'PPP')}, ${slotLabel}${isHotel ? `, ${rooms} room(s)` : ''}.`;
  };

  const handleDirectCall = () => {
    if (businessPhone) window.location.href = `tel:${businessPhone}`;
  };

  const handleDirectWhatsApp = () => {
    if (businessWhatsapp) {
      const phone = businessWhatsapp.replace(/\D/g, '');
      const msg = encodeURIComponent(bookingText());
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        {isHotel ? 'Book a Room' : 'Reserve a Table'}
      </h3>
      
      <div className="bg-muted/50 rounded-lg p-4 space-y-4">
        {/* Date Picker */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Select Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => date < new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Slot */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Time Slot
          </Label>
          <Select value={timeSlot} onValueChange={setTimeSlot}>
            <SelectTrigger>
              <SelectValue placeholder="Select time slot" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((slot) => (
                <SelectItem key={slot.value} value={slot.value}>
                  {slot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Number of People */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Number of {isHotel ? 'Guests' : 'People'}
          </Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={people}
            onChange={(e) => setPeople(parseInt(e.target.value) || 1)}
          />
        </div>

        {/* Rooms (Hotel only) */}
        {isHotel && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <BedDouble className="w-4 h-4" />
              Number of Rooms
            </Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={rooms}
              onChange={(e) => setRooms(parseInt(e.target.value) || 1)}
            />
          </div>
        )}

        <Separator />

        <p className="text-sm font-medium text-foreground">How would you like to book?</p>

        {/* Direct to Vendor */}
        <div className="flex gap-2">
          {businessPhone && (
            <Button
              variant="outline"
              className="flex-1 gap-2"
              disabled={!date || !timeSlot}
              onClick={handleDirectCall}
            >
              <Phone className="h-4 w-4" />
              Call Direct
            </Button>
          )}
          {businessWhatsapp && (
            <Button
              variant="outline"
              className="flex-1 gap-2"
              disabled={!date || !timeSlot}
              onClick={handleDirectWhatsApp}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          )}
        </div>

        {/* Book via Dropee */}
        <Button 
          className="w-full gap-2" 
          onClick={() => {
            if (date && timeSlot) {
              onBookSlot({ date, timeSlot, people, ...(isHotel && { rooms }) });
            }
            onBookViaDropee?.();
          }}
          disabled={!date || !timeSlot}
        >
          <Truck className="h-4 w-4" />
          Book via #Dropee
        </Button>
      </div>
    </div>
  );
}
