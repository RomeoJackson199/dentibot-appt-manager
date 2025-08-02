import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarDays, Clock } from 'lucide-react';

interface DentistAvailabilityProps {
  dentistId: string;
}

export function DentistAvailability({ dentistId }: DentistAvailabilityProps) {
  const { toast } = useToast();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [timeOffDates, setTimeOffDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTimeOffDates();
  }, [dentistId]);

  const fetchTimeOffDates = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('start_datetime, end_datetime')
        .eq('dentist_id', dentistId)
        .eq('event_type', 'time_off');

      if (error) throw error;

      const dates = data?.map(event => new Date(event.start_datetime)) || [];
      setTimeOffDates(dates);
    } catch (error) {
      console.error('Error fetching time off dates:', error);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const dateString = format(date, 'yyyy-MM-dd');
    const existingIndex = selectedDates.findIndex(d => format(d, 'yyyy-MM-dd') === dateString);

    if (existingIndex >= 0) {
      // Remove date if already selected
      setSelectedDates(prev => prev.filter((_, index) => index !== existingIndex));
    } else {
      // Add date if not selected
      setSelectedDates(prev => [...prev, date]);
    }
  };

  const saveTimeOff = async () => {
    if (selectedDates.length === 0) {
      toast({
        title: 'No dates selected',
        description: 'Please select at least one date for time off',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Create time off events for selected dates
      const timeOffEvents = selectedDates.map(date => ({
        dentist_id: dentistId,
        title: 'Time Off',
        description: 'Dentist unavailable',
        event_type: 'time_off',
        start_datetime: new Date(date.setHours(0, 0, 0, 0)).toISOString(),
        end_datetime: new Date(date.setHours(23, 59, 59, 999)).toISOString(),
        is_recurring: false
      }));

      const { error } = await supabase
        .from('calendar_events')
        .insert(timeOffEvents);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Time off scheduled for ${selectedDates.length} day(s)`,
      });

      // Refresh the time off dates and clear selection
      await fetchTimeOffDates();
      setSelectedDates([]);
    } catch (error) {
      console.error('Error saving time off:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule time off',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const removeTimeOff = async (date: Date) => {
    try {
      const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString();

      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('dentist_id', dentistId)
        .eq('event_type', 'time_off')
        .gte('start_datetime', startOfDay)
        .lte('start_datetime', endOfDay);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Time off removed',
      });

      await fetchTimeOffDates();
    } catch (error) {
      console.error('Error removing time off:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove time off',
        variant: 'destructive'
      });
    }
  };

  const isTimeOffDate = (date: Date) => {
    return timeOffDates.some(timeOffDate => 
      format(timeOffDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const isSelectedDate = (date: Date) => {
    return selectedDates.some(selectedDate => 
      format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Schedule Time Off
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Calendar
                mode="single"
                selected={undefined}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
                modifiers={{
                  timeOff: timeOffDates,
                  selected: selectedDates
                }}
                modifiersStyles={{
                  timeOff: { backgroundColor: 'hsl(var(--destructive))', color: 'white' },
                  selected: { backgroundColor: 'hsl(var(--primary))', color: 'white' }
                }}
              />
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-primary rounded"></div>
                  <span>Selected for time off</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-destructive rounded"></div>
                  <span>Already scheduled time off</span>
                </div>
              </div>
            </div>

            <div>
              {selectedDates.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Selected Dates:</h4>
                  <div className="space-y-1">
                    {selectedDates.map((date, index) => (
                      <Badge key={index} variant="outline">
                        {format(date, 'PPP')}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    onClick={saveTimeOff} 
                    disabled={loading}
                    className="mt-3 w-full"
                  >
                    {loading ? 'Saving...' : `Schedule Time Off (${selectedDates.length} days)`}
                  </Button>
                </div>
              )}

              {timeOffDates.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Scheduled Time Off:
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {timeOffDates.map((date, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">{format(date, 'PPP')}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeOff(date)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}