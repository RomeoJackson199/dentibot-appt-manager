import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'patient' | 'dentist' | 'admin';
  phone?: string;
  date_of_birth?: string;
  medical_history?: string;
  preferred_language?: string;
}

interface Dentist {
  id: string;
  profile_id: string;
  specialization?: string;
  license_number?: string;
  is_active: boolean;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dentist, setDentist] = useState<Dentist | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setDentist(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);

      // If user is a dentist, fetch dentist data
      if (profileData.role === 'dentist') {
        const { data: dentistData, error: dentistError } = await supabase
          .from('dentists')
          .select('*')
          .eq('profile_id', profileData.id)
          .single();

        if (dentistError && dentistError.code !== 'PGRST116') {
          console.error('Error fetching dentist data:', dentistError);
        } else {
          setDentist(dentistData);
        }
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    dentist,
    loading,
    refetch: fetchProfile
  };
}