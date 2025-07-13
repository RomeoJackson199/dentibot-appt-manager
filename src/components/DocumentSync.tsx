import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, AlertCircle, CheckCircle2, Loader2, Cloud } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface DocumentSyncProps {
  patientId?: string;
}

export function DocumentSync({ patientId }: DocumentSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Fetch patient documents
  const { data: documents, error, refetch } = useQuery({
    queryKey: ['patient-documents', patientId],
    queryFn: async () => {
      let query = supabase
        .from('patient_documents')
        .select(`
          *,
          patients:patient_id (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: true,
  });

  const handleSyncAll = async () => {
    setIsSyncing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-sync', {
        body: {
          action: 'sync_all',
        },
      });

      if (error) {
        throw new Error(`Sync error: ${error.message}`);
      }

      if (data.success) {
        toast({
          title: "Sync Completed",
          description: `Processed ${data.results.length} documents`,
        });
        refetch();
      } else {
        throw new Error(data.error || 'Sync failed');
      }

    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: error.message || 'Failed to sync documents with Google Drive.',
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getSyncStatusBadge = (document: any) => {
    if (document.is_synced && document.google_drive_file_id) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Synced</Badge>;
    } else {
      return <Badge variant="secondary">Not Synced</Badge>;
    }
  };

  const getLastSyncText = (document: any) => {
    if (document.last_synced_at) {
      return `Last synced: ${new Date(document.last_synced_at).toLocaleString()}`;
    }
    return 'Never synced';
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load documents: {error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Google Drive Sync
            </CardTitle>
            <CardDescription>
              Manage document synchronization with Google Drive
            </CardDescription>
          </div>
          <Button
            onClick={handleSyncAll}
            disabled={isSyncing}
            variant="outline"
            size="sm"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isSyncing ? 'Syncing...' : 'Sync All'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!documents || documents.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No documents found
          </p>
        ) : (
          <div className="space-y-4">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{document.document_name}</h4>
                    {getSyncStatusBadge(document)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Type: {document.document_type} • Size: {document.file_size ? `${(document.file_size / 1024).toFixed(1)} KB` : 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getLastSyncText(document)}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {document.google_drive_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(document.google_drive_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View in Drive
                    </Button>
                  )}
                  
                  {document.is_synced ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}