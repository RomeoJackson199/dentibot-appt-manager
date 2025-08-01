import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AIAssistant from './AIAssistant';

interface TreatmentPlan {
  id?: string;
  title: string;
  description?: string;
  diagnosis?: string;
  estimated_duration_weeks?: number | string | null;
  estimated_cost?: number | string | null;
  status: string;
  priority: string;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string;
}

interface TreatmentPlanFormProps {
  patientId: string;
  dentistId: string;
  onSuccess: () => void;
  plan?: TreatmentPlan;
}

export default function TreatmentPlanForm({ patientId, dentistId, onSuccess, plan }: TreatmentPlanFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: plan?.title || '',
    description: plan?.description || '',
    diagnosis: plan?.diagnosis || '',
    estimated_duration_weeks: plan?.estimated_duration_weeks ? String(plan.estimated_duration_weeks) : '',
    estimated_cost: plan?.estimated_cost ? String(plan.estimated_cost) : '',
    status: plan?.status || 'draft',
    priority: plan?.priority || 'medium',
    start_date: plan?.start_date || '',
    end_date: plan?.end_date || '',
    notes: plan?.notes || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let error;
      if (plan?.id) {
        const res = await supabase
          .from('treatment_plans')
          .update({
            title: formData.title,
            description: formData.description,
            diagnosis: formData.diagnosis,
            estimated_duration_weeks: formData.estimated_duration_weeks ? parseInt(formData.estimated_duration_weeks) : null,
            estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
            status: formData.status,
            priority: formData.priority,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            notes: formData.notes
          })
          .eq('id', plan.id);
        error = res.error;
      } else {
        const res = await supabase
          .from('treatment_plans')
          .insert([
            {
              patient_id: patientId,
              dentist_id: dentistId,
              title: formData.title,
              description: formData.description,
              diagnosis: formData.diagnosis,
              estimated_duration_weeks: formData.estimated_duration_weeks ? parseInt(formData.estimated_duration_weeks) : null,
              estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
              status: formData.status,
              priority: formData.priority,
              start_date: formData.start_date || null,
              end_date: formData.end_date || null,
              notes: formData.notes
            }
          ]);
        error = res.error;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: plan?.id ? "Treatment plan updated successfully" : "Treatment plan created successfully"
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error saving treatment plan:', error);
      toast({
        title: "Error",
        description: plan?.id ? "Failed to update treatment plan" : "Failed to create treatment plan",
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
          <Label htmlFor="title">Treatment Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            required
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="diagnosis">Diagnosis</Label>
          <div className="space-y-2">
            <Textarea
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => handleInputChange('diagnosis', e.target.value)}
              rows={3}
            />
            <AIAssistant
              currentText={formData.diagnosis}
              onTextRewrite={(newText) => handleInputChange('diagnosis', newText)}
              context="Medical diagnosis"
            />
          </div>
        </div>

        <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <div className="space-y-2">
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                    />
                    <AIAssistant
                      currentText={formData.description}
                      onTextRewrite={(newText) => handleInputChange('description', newText)}
                      context="Treatment plan description"
                    />
                  </div>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="estimated_duration_weeks">Duration (weeks)</Label>
          <Input
            id="estimated_duration_weeks"
            type="number"
            value={formData.estimated_duration_weeks}
            onChange={(e) => handleInputChange('estimated_duration_weeks', e.target.value)}
            min="1"
          />
        </div>

        <div>
          <Label htmlFor="estimated_cost">Estimated Cost (€)</Label>
          <Input
            id="estimated_cost"
            type="number"
            step="0.01"
            value={formData.estimated_cost}
            onChange={(e) => handleInputChange('estimated_cost', e.target.value)}
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => handleInputChange('start_date', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => handleInputChange('end_date', e.target.value)}
          />
        </div>

        <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <div className="space-y-2">
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                    />
                    <AIAssistant
                      currentText={formData.notes}
                      onTextRewrite={(newText) => handleInputChange('notes', newText)}
                      context="Treatment plan notes"
                    />
                  </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? (plan?.id ? 'Saving...' : 'Creating...') : plan?.id ? 'Update Treatment Plan' : 'Create Treatment Plan'}
        </Button>
      </div>
    </form>
  );
}