import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Clock, CheckCircle, Calendar, Users, Search } from 'lucide-react';
import { AppointmentCard } from './AppointmentCard';
import { PatientModal } from './PatientModal';
import PatientManagement from './PatientManagement';
import { Agenda } from './Agenda';

interface Appointment {
  id: string;
  patient_name: string;
  patient_age?: number;
  appointment_date: string;
  reason?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  patient_id: string;
  duration_minutes?: number;
  consultation_notes?: string;
}

export function DentistDashboard() {
  const { user } = useAuth();
  const { profile, dentist, loading: profileLoading } = useProfile();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profile) {
      fetchAppointments();
    }
  }, [profile]);

  // Fix for dashboard reloading every 2 minutes - disable auto-refresh
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Only set up polling if explicitly needed (commented out to prevent auto-reload)
    // interval = setInterval(() => {
    //   if (profile) {
    //     fetchAppointments();
    //   }
    // }, 120000); // 2 minutes
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [profile]);

  const fetchAppointments = async () => {
    // For Romeo's account, use Virginie's dentist ID directly
    let dentistId = '46067bae-18f6-4769-b8e4-be48cc18d273'; // Virginie's dentist ID
    
    if (profile?.email !== 'romeojackson199@gmail.com' && dentist?.id) {
      dentistId = dentist.id; // Use their own dentist ID for other users
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('dentist_id', dentistId)
        .in('status', ['pending', 'confirmed'])
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAppointment = async (appointmentId: string) => {
    try {
      setActionLoading(appointmentId);
      
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'confirmed' as const }
            : apt
        )
      );

      toast({
        title: "Appointment Accepted",
        description: "The appointment has been confirmed successfully.",
      });
    } catch (error: any) {
      console.error('Error accepting appointment:', error);
      toast({
        title: "Error",
        description: "Failed to accept appointment",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectAppointment = async (appointmentId: string) => {
    try {
      setActionLoading(appointmentId);
      
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));

      toast({
        title: "Appointment Rejected",
        description: "The appointment has been cancelled.",
      });
    } catch (error: any) {
      console.error('Error rejecting appointment:', error);
      toast({
        title: "Error",
        description: "Failed to reject appointment",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewPatient = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setModalOpen(true);
  };

  const handleSaveSummary = async (appointmentId: string, summary: string) => {
    try {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ 
          consultation_notes: summary,
          status: 'completed'
        })
        .eq('id', appointmentId);

      if (updateError) throw updateError;

      // Remove from current list since it's now completed
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));

      toast({
        title: "Summary Saved",
        description: "Consultation summary has been saved and appointment marked as completed.",
      });
    } catch (error: any) {
      console.error('Error saving summary:', error);
      toast({
        title: "Error",
        description: "Failed to save consultation summary",
        variant: "destructive"
      });
      throw error;
    }
  };

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile || profile.role !== 'dentist') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            This dashboard is only available for dentist accounts.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const acceptedAppointments = appointments.filter(apt => apt.status === 'confirmed');

  const filterMatch = (apt: Appointment) =>
    apt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (apt.reason ? apt.reason.toLowerCase().includes(searchTerm.toLowerCase()) : false);

  const filteredPending = pendingAppointments.filter(filterMatch);
  const filteredAccepted = acceptedAppointments.filter(filterMatch);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dentist Dashboard</h2>
          <p className="text-muted-foreground">
            {profile.email === 'romeojackson199@gmail.com' ? (
              <>Welcome, Dr. {profile.first_name} {profile.last_name} - Managing Virginie Pauwels' Practice</>
            ) : (
              <>Welcome, Dr. {profile.first_name} {profile.last_name}</>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{pendingAppointments.length}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{acceptedAppointments.length}</div>
              <div className="text-sm text-muted-foreground">Accepted</div>
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Requests
            {pendingAppointments.length > 0 && (
              <Badge variant="secondary">{pendingAppointments.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Accepted Appointments
            {acceptedAppointments.length > 0 && (
              <Badge variant="secondary">{acceptedAppointments.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="patients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Patient Management
          </TabsTrigger>
          <TabsTrigger value="agenda" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Agenda
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                <p className="text-muted-foreground text-center">
                  All caught up! No new appointment requests at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPending.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  type="pending"
                  onAccept={handleAcceptAppointment}
                  onReject={handleRejectAppointment}
                  loading={actionLoading === appointment.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4">
          {acceptedAppointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Accepted Appointments</h3>
                <p className="text-muted-foreground text-center">
                  Accept some pending requests to see them here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAccepted.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  type="accepted"
                  onViewPatient={handleViewPatient}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          <PatientManagement />
        </TabsContent>

        <TabsContent value="agenda" className="space-y-4">
          <Agenda />
        </TabsContent>
      </Tabs>

      <PatientModal
        appointment={selectedAppointment}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedAppointment(null);
        }}
        onSaveSummary={handleSaveSummary}
      />
    </div>
  );
}