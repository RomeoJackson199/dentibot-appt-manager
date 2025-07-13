-- Create treatment plans table
CREATE TABLE public.treatment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  dentist_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  diagnosis TEXT,
  treatment_steps JSONB,
  estimated_duration_weeks INTEGER,
  estimated_cost DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medical records table for detailed patient history
CREATE TABLE public.medical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  dentist_id UUID NOT NULL,
  record_type TEXT NOT NULL DEFAULT 'consultation' CHECK (record_type IN ('consultation', 'diagnosis', 'treatment', 'prescription', 'x-ray', 'cleaning', 'surgery', 'follow-up')),
  title TEXT NOT NULL,
  description TEXT,
  findings TEXT,
  recommendations TEXT,
  attachments JSONB,
  visit_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prescriptions table
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  dentist_id UUID NOT NULL,
  treatment_plan_id UUID,
  medical_record_id UUID,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration_days INTEGER,
  instructions TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  prescribed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patient documents table for Google Drive integration
CREATE TABLE public.patient_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  dentist_id UUID NOT NULL,
  treatment_plan_id UUID,
  medical_record_id UUID,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  google_drive_file_id TEXT,
  google_drive_url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  is_synced BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for treatment_plans
CREATE POLICY "Dentists can manage treatment plans for their patients"
ON public.treatment_plans
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN dentists d ON p.id = d.profile_id
    WHERE p.user_id = auth.uid() AND d.id = treatment_plans.dentist_id
  )
);

CREATE POLICY "Patients can view their own treatment plans"
ON public.treatment_plans
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.id = treatment_plans.patient_id
  )
);

-- RLS Policies for medical_records
CREATE POLICY "Dentists can manage medical records for their patients"
ON public.medical_records
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN dentists d ON p.id = d.profile_id
    WHERE p.user_id = auth.uid() AND d.id = medical_records.dentist_id
  )
);

CREATE POLICY "Patients can view their own medical records"
ON public.medical_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.id = medical_records.patient_id
  )
);

-- RLS Policies for prescriptions
CREATE POLICY "Dentists can manage prescriptions for their patients"
ON public.prescriptions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN dentists d ON p.id = d.profile_id
    WHERE p.user_id = auth.uid() AND d.id = prescriptions.dentist_id
  )
);

CREATE POLICY "Patients can view their own prescriptions"
ON public.prescriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.id = prescriptions.patient_id
  )
);

-- RLS Policies for patient_documents
CREATE POLICY "Dentists can manage patient documents"
ON public.patient_documents
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN dentists d ON p.id = d.profile_id
    WHERE p.user_id = auth.uid() AND d.id = patient_documents.dentist_id
  )
);

CREATE POLICY "Patients can view their own documents"
ON public.patient_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.id = patient_documents.patient_id
  )
);

-- Create triggers for updated_at columns
CREATE TRIGGER update_treatment_plans_updated_at
  BEFORE UPDATE ON public.treatment_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_documents_updated_at
  BEFORE UPDATE ON public.patient_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_treatment_plans_patient_id ON public.treatment_plans(patient_id);
CREATE INDEX idx_treatment_plans_dentist_id ON public.treatment_plans(dentist_id);
CREATE INDEX idx_treatment_plans_status ON public.treatment_plans(status);

CREATE INDEX idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX idx_medical_records_dentist_id ON public.medical_records(dentist_id);
CREATE INDEX idx_medical_records_visit_date ON public.medical_records(visit_date);

CREATE INDEX idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX idx_prescriptions_dentist_id ON public.prescriptions(dentist_id);

CREATE INDEX idx_patient_documents_patient_id ON public.patient_documents(patient_id);
CREATE INDEX idx_patient_documents_google_drive_file_id ON public.patient_documents(google_drive_file_id);