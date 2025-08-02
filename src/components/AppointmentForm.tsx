import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AppointmentFormProps {
  patientId: string;
  dentistId: string;
  treatmentPlans: { id: string; title: string }[];
  onSuccess: () => void;
}

export default function AppointmentForm({ patientId, dentistId, treatmentPlans, onSuccess }: AppointmentFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    appointment_date: new Date().toISOString().slice(0,16),
    reason: '',
    notes: '',
    status: 'pending' as 'pending' | 'confirmed' | 'completed' | 'cancelled',
    treatment_plan_id: '',
    duration_minutes: 60
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('appointments').insert({
      patient_id: patientId,
      dentist_id: dentistId,
      appointment_date: formData.appointment_date,
      reason: formData.reason,
      notes: formData.notes,
      status: formData.status,
      duration_minutes: formData.duration_minutes,
      treatment_plan_id: formData.treatment_plan_id || null
    });
    if (error) {
      toast({ title: 'Error', description: 'Failed to create appointment', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Appointment created' });
      onSuccess();
    }
    setLoading(false);
  };

  const handleChange = (field: string, value: string) => {
    const processedValue =
      field === 'treatment_plan_id' && value === 'none' ? '' : value;
    setFormData(prev => ({ ...prev, [field]: processedValue }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="appointment_date">Date & Time *</Label>
          <Input
            id="appointment_date"
            type="datetime-local"
            value={formData.appointment_date}
            onChange={e => handleChange('appointment_date', e.target.value)}
            required
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="reason">Reason</Label>
          <Textarea id="reason" value={formData.reason} onChange={e => handleChange('reason', e.target.value)} rows={3} />
        </div>
        <div className="col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" value={formData.notes} onChange={e => handleChange('notes', e.target.value)} rows={3} />
        </div>
        <div>
          <Label htmlFor="duration_minutes">Duration (minutes)</Label>
          <Input
            id="duration_minutes"
            type="number"
            value={formData.duration_minutes}
            onChange={e => handleChange('duration_minutes', e.target.value)}
            min="15"
            step="15"
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={value => handleChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="treatment_plan_id">Treatment Plan</Label>
          <Select value={formData.treatment_plan_id} onValueChange={value => handleChange('treatment_plan_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {treatmentPlans.map(plan => (
                <SelectItem key={plan.id} value={plan.id}>{plan.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
      </div>
    </form>
  );
}
