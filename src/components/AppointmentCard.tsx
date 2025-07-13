import { Calendar, Clock, User, AlertTriangle, Check, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

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
}

interface AppointmentCardProps {
  appointment: Appointment;
  type: 'pending' | 'accepted';
  onAccept?: (appointmentId: string) => void;
  onReject?: (appointmentId: string) => void;
  onViewPatient?: (appointment: Appointment) => void;
  loading?: boolean;
}

const urgencyColors = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  emergency: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

export function AppointmentCard({ 
  appointment, 
  type, 
  onAccept, 
  onReject, 
  onViewPatient,
  loading = false 
}: AppointmentCardProps) {
  const appointmentDate = new Date(appointment.appointment_date);
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {appointment.patient_name}
            {appointment.patient_age && (
              <span className="text-sm text-muted-foreground">
                (Age: {appointment.patient_age})
              </span>
            )}
          </CardTitle>
          <Badge className={urgencyColors[appointment.urgency]}>
            {appointment.urgency}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(appointmentDate, 'PPP')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{format(appointmentDate, 'p')}</span>
          </div>
        </div>

        {appointment.reason && (
          <div>
            <p className="font-medium text-sm mb-1">Reason for visit:</p>
            <p className="text-sm text-muted-foreground">{appointment.reason}</p>
          </div>
        )}

        {appointment.notes && (
          <div>
            <p className="font-medium text-sm mb-1 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Medical Notes:
            </p>
            <p className="text-sm text-muted-foreground">{appointment.notes}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {type === 'pending' ? (
            <>
              <Button
                size="sm"
                onClick={() => onAccept?.(appointment.id)}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <Check className="h-4 w-4" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject?.(appointment.id)}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewPatient?.(appointment)}
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              View Patient
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}