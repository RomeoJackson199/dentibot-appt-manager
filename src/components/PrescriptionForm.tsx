import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface PrescriptionFormProps {
  patientId: string;
  dentistId: string;
  onSuccess: () => void;
}

export default function PrescriptionForm({ patientId, dentistId, onSuccess }: PrescriptionFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    duration_days: '',
    instructions: '',
    status: 'active',
    prescribed_date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('prescriptions')
        .insert([
          {
            patient_id: patientId,
            dentist_id: dentistId,
            medication_name: formData.medication_name,
            dosage: formData.dosage,
            frequency: formData.frequency,
            duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
            instructions: formData.instructions,
            status: formData.status,
            prescribed_date: formData.prescribed_date
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Prescription created successfully"
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating prescription:', error);
      toast({
        title: "Error",
        description: "Failed to create prescription",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="medication_name">Medication Name *</Label>
          <Input
            id="medication_name"
            value={formData.medication_name}
            onChange={(e) => handleInputChange('medication_name', e.target.value)}
            required
            placeholder="e.g., Amoxicillin, Ibuprofen"
          />
        </div>

        <div>
          <Label htmlFor="dosage">Dosage *</Label>
          <Input
            id="dosage"
            value={formData.dosage}
            onChange={(e) => handleInputChange('dosage', e.target.value)}
            required
            placeholder="e.g., 500mg, 200mg"
          />
        </div>

        <div>
          <Label htmlFor="frequency">Frequency *</Label>
          <Select value={formData.frequency} onValueChange={(value) => handleInputChange('frequency', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Once daily">Once daily</SelectItem>
              <SelectItem value="Twice daily">Twice daily</SelectItem>
              <SelectItem value="Three times daily">Three times daily</SelectItem>
              <SelectItem value="Four times daily">Four times daily</SelectItem>
              <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
              <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
              <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
              <SelectItem value="As needed">As needed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="duration_days">Duration (days)</Label>
          <Input
            id="duration_days"
            type="number"
            value={formData.duration_days}
            onChange={(e) => handleInputChange('duration_days', e.target.value)}
            min="1"
            placeholder="e.g., 7, 14"
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="prescribed_date">Prescribed Date *</Label>
          <Input
            id="prescribed_date"
            type="date"
            value={formData.prescribed_date}
            onChange={(e) => handleInputChange('prescribed_date', e.target.value)}
            required
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="instructions">Special Instructions</Label>
          <Textarea
            id="instructions"
            value={formData.instructions}
            onChange={(e) => handleInputChange('instructions', e.target.value)}
            rows={3}
            placeholder="Take with food, avoid alcohol, etc."
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading || !formData.medication_name || !formData.dosage || !formData.frequency}>
          {loading ? 'Creating...' : 'Create Prescription'}
        </Button>
      </div>
    </form>
  );
}