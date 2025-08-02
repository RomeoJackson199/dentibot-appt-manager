import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface AppointmentCompletionFormProps {
  appointmentId: string;
  patientName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AppointmentCompletionForm({ 
  appointmentId, 
  patientName, 
  onSuccess, 
  onCancel 
}: AppointmentCompletionFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    consultation_notes: '',
    prescriptions: [] as Array<{
      medication_name: string;
      dosage: string;
      frequency: string;
      duration_days: number;
      instructions: string;
    }>,
    treatment_plan_notes: '',
    follow_up_required: false,
    follow_up_date: ''
  });

  const addPrescription = () => {
    setFormData(prev => ({
      ...prev,
      prescriptions: [
        ...prev.prescriptions,
        {
          medication_name: '',
          dosage: '',
          frequency: '',
          duration_days: 7,
          instructions: ''
        }
      ]
    }));
  };

  const removePrescription = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter((_, i) => i !== index)
    }));
  };

  const updatePrescription = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.map((prescription, i) =>
        i === index ? { ...prescription, [field]: value } : prescription
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update appointment status and notes
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({
          status: 'completed',
          consultation_notes: formData.consultation_notes
        })
        .eq('id', appointmentId);

      if (appointmentError) throw appointmentError;

      // Add prescriptions if any
      if (formData.prescriptions.length > 0) {
        // Get appointment details for patient and dentist IDs
        const { data: appointment } = await supabase
          .from('appointments')
          .select('patient_id, dentist_id')
          .eq('id', appointmentId)
          .single();

        if (appointment) {
          const prescriptionsToInsert = formData.prescriptions
            .filter(p => p.medication_name.trim())
            .map(prescription => ({
              patient_id: appointment.patient_id,
              dentist_id: appointment.dentist_id,
              medication_name: prescription.medication_name,
              dosage: prescription.dosage,
              frequency: prescription.frequency,
              duration_days: prescription.duration_days,
              instructions: prescription.instructions,
              prescribed_date: new Date().toISOString().split('T')[0]
            }));

          if (prescriptionsToInsert.length > 0) {
            const { error: prescriptionError } = await supabase
              .from('prescriptions')
              .insert(prescriptionsToInsert);

            if (prescriptionError) throw prescriptionError;
          }
        }
      }

      toast({
        title: 'Success',
        description: 'Appointment completed successfully',
      });

      onSuccess();
    } catch (error) {
      console.error('Error completing appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete appointment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Complete Appointment - {patientName}
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Consultation Notes */}
          <div>
            <Label htmlFor="consultation_notes">Consultation Notes *</Label>
            <Textarea
              id="consultation_notes"
              value={formData.consultation_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, consultation_notes: e.target.value }))}
              placeholder="Describe the consultation, findings, and treatment provided..."
              rows={4}
              required
            />
          </div>

          {/* Prescriptions */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <Label>Prescriptions</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPrescription}>
                Add Prescription
              </Button>
            </div>
            
            {formData.prescriptions.map((prescription, index) => (
              <Card key={index} className="mb-3">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Prescription {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePrescription(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Medication Name *</Label>
                      <Input
                        value={prescription.medication_name}
                        onChange={(e) => updatePrescription(index, 'medication_name', e.target.value)}
                        placeholder="e.g., Amoxicillin"
                        required
                      />
                    </div>
                    <div>
                      <Label>Dosage *</Label>
                      <Input
                        value={prescription.dosage}
                        onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                        placeholder="e.g., 500mg"
                        required
                      />
                    </div>
                    <div>
                      <Label>Frequency *</Label>
                      <Select
                        value={prescription.frequency}
                        onValueChange={(value) => updatePrescription(index, 'frequency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Once daily">Once daily</SelectItem>
                          <SelectItem value="Twice daily">Twice daily</SelectItem>
                          <SelectItem value="Three times daily">Three times daily</SelectItem>
                          <SelectItem value="Four times daily">Four times daily</SelectItem>
                          <SelectItem value="As needed">As needed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Duration (days)</Label>
                      <Input
                        type="number"
                        value={prescription.duration_days}
                        onChange={(e) => updatePrescription(index, 'duration_days', parseInt(e.target.value) || 0)}
                        min="1"
                        max="90"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Instructions</Label>
                      <Textarea
                        value={prescription.instructions}
                        onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                        placeholder="Additional instructions for the patient..."
                        rows={2}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Treatment Plan Notes */}
          <div>
            <Label htmlFor="treatment_plan_notes">Treatment Plan Notes</Label>
            <Textarea
              id="treatment_plan_notes"
              value={formData.treatment_plan_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, treatment_plan_notes: e.target.value }))}
              placeholder="Any updates to treatment plan, next steps, etc..."
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.consultation_notes.trim()}>
              {loading ? 'Completing...' : 'Complete Appointment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}