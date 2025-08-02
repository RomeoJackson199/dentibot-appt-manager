import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { User, Calendar, Clock, AlertTriangle, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Appointment {
  id: string;
  patient_name: string;
  patient_age?: number;
  appointment_date: string;
  reason?: string;
  notes?: string;
  symptoms?: {
    pain_level: number | null;
    has_swelling: boolean | null;
    has_bleeding: boolean | null;
    duration_symptoms: string | null;
  } | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  patient_id: string;
  duration_minutes?: number;
  consultation_notes?: string;
}

interface PatientModalProps {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  onSaveSummary: (appointmentId: string, summary: string) => Promise<void>;
  onComplete: (appointmentId: string, summary: string) => Promise<void>;
  loading?: boolean;
}

const urgencyColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  emergency: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

export function PatientModal({ 
  appointment, 
  open, 
  onClose, 
  onSaveSummary,
  onComplete,
  loading = false 
}: PatientModalProps) {
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appointment && open) {
      // Pre-fill with existing consultation notes if any
      setSummary(appointment.consultation_notes || '');
    }
  }, [appointment, open]);

  const handleSave = async () => {
    if (!appointment || !summary.trim()) return;
    
    setSaving(true);
    try {
      await onSaveSummary(appointment.id, summary.trim());
      onClose();
    } catch (error) {
      console.error('Failed to save summary:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!appointment) return;

    let finalSummary = summary.trim();
    const feedback = window.prompt('How did the appointment go?');
    if (feedback && feedback.trim()) {
      finalSummary = finalSummary
        ? `${finalSummary}\n\n${feedback.trim()}`
        : feedback.trim();
    }

    setSaving(true);
    try {
      await onComplete(appointment.id, finalSummary);
      onClose();
    } catch (error) {
      console.error('Failed to complete appointment:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!appointment) return null;

  const appointmentDate = new Date(appointment.appointment_date);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Patient Details
          </DialogTitle>
          <DialogDescription>
            View patient information and add consultation summary
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Patient Name</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-semibold">{appointment.patient_name}</span>
                {appointment.patient_age && (
                  <span className="text-sm text-muted-foreground">
                    (Age: {appointment.patient_age})
                  </span>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Urgency Level</Label>
              <div className="mt-1">
                <Badge className={urgencyColors[appointment.urgency]}>
                  {appointment.urgency.charAt(0).toUpperCase() + appointment.urgency.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Date</Label>
                <p className="text-sm">{format(appointmentDate, 'PPP')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Time</Label>
                <p className="text-sm">{format(appointmentDate, 'p')}</p>
              </div>
            </div>
          </div>

          {appointment.reason && (
            <div>
              <Label className="text-sm font-medium">Reason for Visit</Label>
              <p className="text-sm text-muted-foreground mt-1 p-3 bg-muted rounded-md">
                {appointment.reason}
              </p>
            </div>
          )}

          {appointment.notes && (
            <div>
              <Label className="text-sm font-medium flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Medical Notes/Allergies
              </Label>
              <p className="text-sm text-muted-foreground mt-1 p-3 bg-orange-50 dark:bg-orange-950 rounded-md">
                {appointment.notes}
              </p>
            </div>
          )}

          {appointment.symptoms && (
            <div>
              <Label className="text-sm font-medium">Symptoms</Label>
              <ul className="text-sm text-muted-foreground mt-1 ml-4 list-disc space-y-1">
                {appointment.symptoms.pain_level !== null && (
                  <li>Pain level: {appointment.symptoms.pain_level}</li>
                )}
                {appointment.symptoms.has_swelling !== null && (
                  <li>
                    {appointment.symptoms.has_swelling ? 'Swelling present' : 'No swelling'}
                  </li>
                )}
                {appointment.symptoms.has_bleeding !== null && (
                  <li>
                    {appointment.symptoms.has_bleeding ? 'Bleeding present' : 'No bleeding'}
                  </li>
                )}
                {appointment.symptoms.duration_symptoms && (
                  <li>Duration: {appointment.symptoms.duration_symptoms}</li>
                )}
              </ul>
            </div>
          )}

          <Separator />

          {/* Dentist Notes */}
          <div>
            <Label htmlFor="summary" className="text-sm font-medium">
              Dentist Notes
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Add private notes related to this appointment. These notes are visible only to you.
            </p>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Enter any observations or reminders for this appointment..."
              className="min-h-[120px]"
              disabled={saving}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!summary.trim() || saving}
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Notes
                </>
              )}
            </Button>
            <Button onClick={handleComplete} disabled={saving} variant="secondary">
              {saving ? 'Completing...' : 'Complete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}