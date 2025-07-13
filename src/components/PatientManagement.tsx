import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, FileText, Calendar, Pill, FolderOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TreatmentPlanForm from './TreatmentPlanForm';
import MedicalRecordForm from './MedicalRecordForm';
import PrescriptionForm from './PrescriptionForm';
import { GoogleDriveUpload } from './GoogleDriveUpload';

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
  status: string;
  priority: string;
  estimated_cost?: number;
  start_date?: string;
  end_date?: string;
}

interface MedicalRecord {
  id: string;
  title: string;
  record_type: string;
  visit_date: string;
  description?: string;
}

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  status: string;
  prescribed_date: string;
}

export default function PatientManagement() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'treatment' | 'record' | 'prescription'>('treatment');

  const dentistId = '46067bae-18f6-4769-b8e4-be48cc18d273'; // Virginie's dentist ID

  useEffect(() => {
    if (profile) {
      fetchPatients();
    }
  }, [profile]);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientData(selectedPatient.id);
    }
  }, [selectedPatient]);

  const fetchPatients = async () => {
    try {
      // Get patients from appointments
      const { data: appointmentPatients, error } = await supabase
        .from('appointments')
        .select(`
          patient_id,
          profiles!appointments_patient_id_fkey (
            id,
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            address,
            emergency_contact,
            medical_history
          )
        `)
        .eq('dentist_id', dentistId);

      if (error) throw error;

      // Extract unique patients
      const uniquePatients = new Map();
      appointmentPatients?.forEach(item => {
        if (item.profiles && !uniquePatients.has(item.patient_id)) {
          uniquePatients.set(item.patient_id, item.profiles);
        }
      });

      setPatients(Array.from(uniquePatients.values()));
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "Failed to load patients",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientData = async (patientId: string) => {
    try {
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

      setTreatmentPlans(treatmentData || []);
      setMedicalRecords(recordData || []);
      setPrescriptions(prescriptionData || []);
    } catch (error: any) {
      console.error('Error fetching patient data:', error);
    }
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openDialog = (type: 'treatment' | 'record' | 'prescription') => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setDialogOpen(false);
    if (selectedPatient) {
      fetchPatientData(selectedPatient.id);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading patients...</div>;
  }

  return (
    <div className="flex h-full">
      {/* Patient List Sidebar */}
      <div className="w-1/3 border-r bg-muted/10 p-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  selectedPatient?.id === patient.id ? 'bg-primary/10 border-primary' : ''
                }`}
                onClick={() => setSelectedPatient(patient)}
              >
                <CardContent className="p-3">
                  <h3 className="font-medium">
                    {patient.first_name} {patient.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{patient.email}</p>
                  {patient.phone && (
                    <p className="text-xs text-muted-foreground">{patient.phone}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Patient Details */}
      <div className="flex-1 p-6">
        {selectedPatient ? (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </h1>
                <p className="text-muted-foreground">{selectedPatient.email}</p>
              </div>
              
              <div className="flex gap-2">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => openDialog('treatment')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Treatment Plan
                    </Button>
                  </DialogTrigger>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => openDialog('record')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Medical Record
                    </Button>
                  </DialogTrigger>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => openDialog('prescription')}>
                      <Pill className="h-4 w-4 mr-2" />
                      Prescription
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {dialogType === 'treatment' && 'New Treatment Plan'}
                        {dialogType === 'record' && 'New Medical Record'}
                        {dialogType === 'prescription' && 'New Prescription'}
                      </DialogTitle>
                    </DialogHeader>
                    
                    {dialogType === 'treatment' && (
                      <TreatmentPlanForm
                        patientId={selectedPatient.id}
                        dentistId={dentistId}
                        onSuccess={handleFormSuccess}
                      />
                    )}
                    {dialogType === 'record' && (
                      <MedicalRecordForm
                        patientId={selectedPatient.id}
                        dentistId={dentistId}
                        onSuccess={handleFormSuccess}
                      />
                    )}
                    {dialogType === 'prescription' && (
                      <PrescriptionForm
                        patientId={selectedPatient.id}
                        dentistId={dentistId}
                        onSuccess={handleFormSuccess}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Tabs defaultValue="treatment-plans" className="w-full">
              <TabsList>
                <TabsTrigger value="treatment-plans">Treatment Plans</TabsTrigger>
                <TabsTrigger value="medical-records">Medical Records</TabsTrigger>
                <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="treatment-plans" className="space-y-4">
                {treatmentPlans.map((plan) => (
                  <Card key={plan.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{plan.title}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                            {plan.status}
                          </Badge>
                          <Badge variant={plan.priority === 'high' ? 'destructive' : 'outline'}>
                            {plan.priority}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {plan.estimated_cost && (
                        <p className="text-sm">Estimated Cost: €{plan.estimated_cost}</p>
                      )}
                      {plan.start_date && plan.end_date && (
                        <p className="text-sm text-muted-foreground">
                          {plan.start_date} - {plan.end_date}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="medical-records" className="space-y-4">
                {medicalRecords.map((record) => (
                  <Card key={record.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{record.title}</CardTitle>
                        <Badge variant="outline">{record.record_type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        Visit Date: {record.visit_date}
                      </p>
                      {record.description && (
                        <p className="text-sm">{record.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="prescriptions" className="space-y-4">
                {prescriptions.map((prescription) => (
                  <Card key={prescription.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{prescription.medication_name}</CardTitle>
                        <Badge variant={prescription.status === 'active' ? 'default' : 'secondary'}>
                          {prescription.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Dosage: {prescription.dosage}</p>
                      <p className="text-sm">Frequency: {prescription.frequency}</p>
                      <p className="text-sm text-muted-foreground">
                        Prescribed: {prescription.prescribed_date}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <GoogleDriveUpload
                  patientId={selectedPatient.id}
                  patientName={`${selectedPatient.first_name} ${selectedPatient.last_name}`}
                  dentistId={dentistId}
                  onUploadComplete={() => {
                    toast({
                      title: "Success",
                      description: "Document uploaded to Google Drive successfully",
                    });
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Select a Patient</h2>
              <p className="text-muted-foreground">Choose a patient from the list to view their details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}