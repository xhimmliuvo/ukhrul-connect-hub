import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, Users, BedDouble } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingSectionProps {
  businessType: 'cafe' | 'restaurant' | 'hotel';
  onBookSlot: (booking: {
    date: Date;
    timeSlot: string;
    people: number;
    rooms?: number;
  }) => void;
}

const timeSlots = [
  { value: 'morning', label: 'Morning (8AM - 12PM)' },
  { value: 'afternoon', label: 'Afternoon (12PM - 4PM)' },
  { value: 'evening', label: 'Evening (4PM - 8PM)' },
  { value: 'night', label: 'Night (8PM - 11PM)' },
];

export function BookingSection({ businessType, onBookSlot }: BookingSectionProps) {
  const [date, setDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [people, setPeople] = useState<number>(2);
  const [rooms, setRooms] = useState<number>(1);

  const isHotel = businessType === 'hotel';

  const handleSubmit = () => {
    if (!date || !timeSlot) return;
    onBookSlot({
      date,
      timeSlot,
      people,
      ...(isHotel && { rooms }),
    });
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

        <Button 
          className="w-full" 
          onClick={handleSubmit}
          disabled={!date || !timeSlot}
        >
          {isHotel ? 'Reserve Now' : 'Book a Slot'}
        </Button>
      </div>
    </div>
  );
}
