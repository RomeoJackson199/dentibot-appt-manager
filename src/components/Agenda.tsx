import { useState, useEffect } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Calendar as CalendarIcon, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  patient_name: string;
  appointment_date: string;
  reason?: string;
  notes?: string;
  patient_id: string;
}

interface Document {
  id: string;
  document_name: string;
  google_drive_url: string | null;
}

function PatientDocuments({ patientId }: { patientId: string }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!open && documents.length === 0) {
      setLoading(true);
      const { data, error } = await supabase
        .from('patient_documents')
        .select('id, document_name, google_drive_url')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (!error) {
        setDocuments(data || []);
      }
      setLoading(false);
    }
    setOpen(!open);
  };

  return (
    <div className="mt-2 text-sm">
      <Button variant="ghost" size="sm" onClick={toggle} className="px-2 h-6">
        <FileText className="h-4 w-4 mr-1" />
        {open ? 'Hide' : 'View'} Documents
      </Button>
      {open && (
        <div className="mt-2 ml-1">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : documents.length === 0 ? (
            <p className="text-muted-foreground">No documents</p>
          ) : (
            <ul className="space-y-1">
              {documents.map((doc) => (
                <li key={doc.id} className="flex justify-between items-center">
                  <span>{doc.document_name}</span>
                  {doc.google_drive_url && (
                    <a
                      href={doc.google_drive_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      Open
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function Agenda() {
  const { profile, dentist } = useProfile();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      fetchAppointments(selectedDate);
    }
  }, [selectedDate, profile]);

  const fetchAppointments = async (date: Date) => {
    if (!profile) return;
    setLoading(true);

    let dentistId = '46067bae-18f6-4769-b8e4-be48cc18d273';
    if (profile.email !== 'romeojackson199@gmail.com' && dentist?.id) {
      dentistId = dentist.id;
    }

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('dentist_id', dentistId)
      .gte('appointment_date', startOfDay(date).toISOString())
      .lte('appointment_date', endOfDay(date).toISOString())
      .order('appointment_date', { ascending: true });

    if (error) {
      console.error('Error fetching agenda:', error);
      toast({
        title: 'Error',
        description: 'Failed to load appointments for this date',
        variant: 'destructive',
      });
      setAppointments([]);
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" /> Agenda
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>
            Appointments {selectedDate && `for ${format(selectedDate, 'PPP')}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No appointments for this date
            </p>
          ) : (
            <ScrollArea className="h-72 pr-2">
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="border rounded-lg p-3 space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{apt.patient_name}</p>
                        {apt.reason && (
                          <p className="text-sm text-muted-foreground">
                            {apt.reason}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {format(new Date(apt.appointment_date), 'p')}
                      </Badge>
                    </div>
                    {apt.notes && (
                      <p className="text-xs text-muted-foreground">
                        Notes: {apt.notes}
                      </p>
                    )}
                    <PatientDocuments patientId={apt.patient_id} />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Agenda;
