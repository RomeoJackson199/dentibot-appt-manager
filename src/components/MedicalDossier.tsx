import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Separator } from '@/components/ui/separator';
import { Calendar, FileText, Pill, Heart, User, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import TreatmentPlanSteps from './TreatmentPlanSteps';
import { useToast } from '@/hooks/use-toast';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact?: string;
  medical_history?: string;
}

interface TreatmentPlan {
  id: string;
  title: string;
  description?: string;
  diagnosis?: string;
  status: string;
  priority: string;
  estimated_cost?: number;
  start_date?: string;
  end_date?: string;
  notes?: string;
  created_at: string;
}

interface MedicalRecord {
  id: string;
  title: string;
  record_type: string;
  visit_date: string;
  description?: string;
  findings?: string;
  recommendations?: string;
  created_at: string;
}

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration_days?: number;
  instructions?: string;
  status: string;
  prescribed_date: string;
  created_at: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  reason?: string;
  status: string;
  notes?: string;
  consultation_notes?: string;
}

interface MedicalDossierProps {
  patientId: string;
  dentistId: string;
}

export default function MedicalDossier({ patientId, dentistId }: MedicalDossierProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [nextNotes, setNextNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [loading, setLoading] = useState(true);
  const dossierRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, [patientId, dentistId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch patient info
      const { data: patientData, error: patientError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError) throw patientError;
      setPatient(patientData);

      // Fetch treatment plans
      const { data: treatmentData } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false });

      // Fetch medical records
      const { data: recordData } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('visit_date', { ascending: false });

      // Fetch prescriptions
      const { data: prescriptionData } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('prescribed_date', { ascending: false });

      // Fetch appointments
      const { data: appointmentData } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('appointment_date', { ascending: true });

      setTreatmentPlans(treatmentData || []);
      setMedicalRecords(recordData || []);
      setPrescriptions(prescriptionData || []);
      setAppointments(appointmentData || []);

      const upcoming = (appointmentData || []).find(
        (a: any) =>
          ['pending', 'confirmed'].includes(a.status) &&
          new Date(a.appointment_date) > new Date()
      );
      if (upcoming) {
        setNextNotes(upcoming.consultation_notes || '');
      }

    } catch (error: any) {
      console.error('Error fetching dossier data:', error);
      toast({
        title: "Error",
        description: "Failed to load medical dossier",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!dossierRef.current) return;
    const canvas = await html2canvas(dossierRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`dossier-${patient?.last_name ?? ''}.pdf`);
  };

  const handleSaveNextNotes = async (appointmentId: string) => {
    if (!nextNotes.trim()) return;
    setSavingNotes(true);
    const { error } = await supabase
      .from('appointments')
      .update({ consultation_notes: nextNotes })
      .eq('id', appointmentId);
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save notes',
        variant: 'destructive',
      });
    } else {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, consultation_notes: nextNotes } : a
        )
      );
      toast({ title: 'Notes Saved' });
    }
    setSavingNotes(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading medical dossier...</div>;
  }

  if (!patient) {
    return <div className="text-center text-muted-foreground">Patient not found</div>;
  }

  const nextAppointment = appointments.find(
    (apt) =>
      ['pending', 'confirmed'].includes(apt.status) &&
      new Date(apt.appointment_date) > new Date()
  );

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-end">
        <Button size="sm" onClick={handleDownload}>Download PDF</Button>
      </div>
      <div ref={dossierRef} className="space-y-6">
      {/* Patient Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-lg">
                {patient.first_name} {patient.last_name}
              </h3>
              <p className="text-muted-foreground">{patient.email}</p>
              {patient.phone && (
                <p className="flex items-center gap-1 text-sm">
                  <Phone className="h-4 w-4" />
                  {patient.phone}
                </p>
              )}
              {patient.date_of_birth && (
                <p className="flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4" />
                  Born: {patient.date_of_birth}
                </p>
              )}
            </div>
            <div>
              {patient.address && (
                <p className="flex items-center gap-1 text-sm">
                  <MapPin className="h-4 w-4" />
                  {patient.address}
                </p>
              )}
              {patient.emergency_contact && (
                <p className="flex items-center gap-1 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Emergency: {patient.emergency_contact}
                </p>
              )}
            </div>
          </div>
          {patient.medical_history && (
            <div className="mt-4">
              <h4 className="font-medium flex items-center gap-1">
                <Heart className="h-4 w-4" />
                Medical History
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {patient.medical_history}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Past Prescriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prescriptions.filter(p => p.status !== 'active').length > 0 ? (
            <div className="space-y-3">
              {prescriptions
                .filter(p => p.status !== 'active')
                .map((prescription) => (
                  <div key={prescription.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{prescription.medication_name}</h4>
                      <Badge variant="secondary">{prescription.status}</Badge>
                    </div>
                    <p className="text-sm">
                      {prescription.dosage} - {prescription.frequency}
                    </p>
                    {prescription.instructions && (
                      <p className="text-xs text-muted-foreground">
                        {prescription.instructions}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No past prescriptions</p>
          )}
        </CardContent>
      </Card>

      {nextAppointment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Next Appointment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              {new Date(nextAppointment.appointment_date).toLocaleString()}
            </p>
            {nextAppointment.reason && (
              <p className="text-sm text-muted-foreground">
                {nextAppointment.reason}
              </p>
            )}
            <div className="space-y-2">
              <Textarea
                value={nextNotes}
                onChange={(e) => setNextNotes(e.target.value)}
                placeholder="Add notes..."
                rows={3}
              />
              <Button
                size="sm"
                onClick={() => handleSaveNextNotes(nextAppointment.id)}
                disabled={savingNotes}
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Treatment Plans Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Active Treatment Plans ({treatmentPlans.filter(tp => tp.status === 'active').length})</CardTitle>
        </CardHeader>
        <CardContent>
          {treatmentPlans.filter(tp => tp.status === 'active').length > 0 ? (
            <div className="space-y-3">
              {treatmentPlans.filter(tp => tp.status === 'active').map((plan) => (
                <div key={plan.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{plan.title}</h4>
                    <Badge variant={plan.priority === 'high' ? 'destructive' : 'default'}>
                      {plan.priority}
                    </Badge>
                  </div>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  )}
                  {plan.estimated_cost && (
                    <p className="text-sm">Cost: €{plan.estimated_cost}</p>
                  )}
                  <TreatmentPlanSteps planId={plan.id} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No active treatment plans</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Medical Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Medical Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medicalRecords.slice(0, 3).length > 0 ? (
            <div className="space-y-3">
              {medicalRecords.slice(0, 3).map((record) => (
                <div key={record.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{record.title}</h4>
                    <Badge variant="outline">{record.record_type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Visit: {record.visit_date}
                  </p>
                  {record.findings && (
                    <p className="text-sm">{record.findings}</p>
                  )}
                </div>
              ))}
              {medicalRecords.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  +{medicalRecords.length - 3} more records
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No medical records</p>
          )}
        </CardContent>
      </Card>

      {/* Active Prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Active Prescriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prescriptions.filter(p => p.status === 'active').length > 0 ? (
            <div className="space-y-3">
              {prescriptions.filter(p => p.status === 'active').map((prescription) => (
                <div key={prescription.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{prescription.medication_name}</h4>
                    <Badge>{prescription.status}</Badge>
                  </div>
                  <p className="text-sm">
                    {prescription.dosage} - {prescription.frequency}
                  </p>
                  {prescription.instructions && (
                    <p className="text-xs text-muted-foreground">
                      {prescription.instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No active prescriptions</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.slice(0, 3).length > 0 ? (
            <div className="space-y-3">
              {appointments.slice(0, 3).map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">
                      {new Date(appointment.appointment_date).toLocaleDateString()}
                    </p>
                    <Badge variant={
                      appointment.status === 'confirmed' ? 'default' :
                      appointment.status === 'pending' ? 'secondary' : 'destructive'
                    }>
                      {appointment.status}
                    </Badge>
                  </div>
                  {appointment.reason && (
                    <p className="text-sm">{appointment.reason}</p>
                  )}
                  {appointment.consultation_notes && (
                    <p className="text-xs text-muted-foreground">
                      Notes: {appointment.consultation_notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No appointments</p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}