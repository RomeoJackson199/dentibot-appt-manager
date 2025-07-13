import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Stethoscope } from 'lucide-react';

const Auth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);



  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Stethoscope className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold text-foreground">DentiBot</h1>
          </div>
          <p className="text-muted-foreground">Professional dental practice management platform</p>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Access Restricted</h2>
          <p className="text-muted-foreground">
            This is a dental practice management system. Access is restricted to authorized dentists only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;