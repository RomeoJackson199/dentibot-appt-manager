import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AIAssistant from './AIAssistant';

interface MedicalRecord {
  id?: string;
  title: string;
  record_type: string;
  description?: string;
  findings?: string;
  recommendations?: string;
  visit_date: string;
}

interface MedicalRecordFormProps {
  patientId: string;
  dentistId: string;
  onSuccess: () => void;
  record?: MedicalRecord;
}

export default function MedicalRecordForm({ patientId, dentistId, onSuccess, record }: MedicalRecordFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: record?.title || '',
    record_type: record?.record_type || 'consultation',
    description: record?.description || '',
    findings: record?.findings || '',
    recommendations: record?.recommendations || '',
    visit_date: record?.visit_date || new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let error;
      if (record?.id) {
        const res = await supabase
          .from('medical_records')
          .update({
            title: formData.title,
            record_type: formData.record_type,
            description: formData.description,
            findings: formData.findings,
            recommendations: formData.recommendations,
            visit_date: formData.visit_date
          })
          .eq('id', record.id);
        error = res.error;
      } else {
        const res = await supabase
          .from('medical_records')
          .insert([
            {
              patient_id: patientId,
              dentist_id: dentistId,
              title: formData.title,
              record_type: formData.record_type,
              description: formData.description,
              findings: formData.findings,
              recommendations: formData.recommendations,
              visit_date: formData.visit_date
            }
          ]);
        error = res.error;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: record?.id ? "Medical record updated successfully" : "Medical record created successfully"
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error saving medical record:', error);
      toast({
        title: "Error",
        description: record?.id ? "Failed to update medical record" : "Failed to create medical record",
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
          <Label htmlFor="title">Record Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="record_type">Record Type</Label>
          <Select value={formData.record_type} onValueChange={(value) => handleInputChange('record_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="diagnosis">Diagnosis</SelectItem>
              <SelectItem value="treatment">Treatment</SelectItem>
              <SelectItem value="prescription">Prescription</SelectItem>
              <SelectItem value="x-ray">X-Ray</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="surgery">Surgery</SelectItem>
              <SelectItem value="follow-up">Follow-up</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="visit_date">Visit Date *</Label>
          <Input
            id="visit_date"
            type="date"
            value={formData.visit_date}
            onChange={(e) => handleInputChange('visit_date', e.target.value)}
            required
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="description">Description</Label>
          <div className="space-y-2">
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              placeholder="General description of the visit or procedure"
            />
            <AIAssistant
              currentText={formData.description}
              onTextRewrite={(newText) => handleInputChange('description', newText)}
              context="Medical record description"
            />
          </div>
        </div>

        <div className="col-span-2">
          <Label htmlFor="findings">Clinical Findings</Label>
          <div className="space-y-2">
            <Textarea
              id="findings"
              value={formData.findings}
              onChange={(e) => handleInputChange('findings', e.target.value)}
              rows={3}
              placeholder="Detailed clinical observations and findings"
            />
            <AIAssistant
              currentText={formData.findings}
              onTextRewrite={(newText) => handleInputChange('findings', newText)}
              context="Medical findings"
            />
          </div>
        </div>

        <div className="col-span-2">
          <Label htmlFor="recommendations">Recommendations</Label>
          <div className="space-y-2">
            <Textarea
              id="recommendations"
              value={formData.recommendations}
              onChange={(e) => handleInputChange('recommendations', e.target.value)}
              rows={3}
              placeholder="Treatment recommendations and follow-up instructions"
            />
            <AIAssistant
              currentText={formData.recommendations}
              onTextRewrite={(newText) => handleInputChange('recommendations', newText)}
              context="Medical recommendations"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? (record?.id ? 'Saving...' : 'Creating...') : record?.id ? 'Update Medical Record' : 'Create Medical Record'}
        </Button>
      </div>
    </form>
  );
}