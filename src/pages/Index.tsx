import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Loader2, Stethoscope } from "lucide-react";
import { DentistDashboard } from "@/components/DentistDashboard";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Stethoscope className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-xl font-bold text-foreground">DentiBot</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.first_name} {profile?.last_name}
            </span>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {profile?.role === 'dentist' ? (
          <DentistDashboard />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Patient Dashboard</h2>
            <p className="text-muted-foreground">
              Patient features coming soon! This platform is currently focused on dentist appointment management.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
