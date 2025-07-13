import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Cloud, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GoogleDriveUploadProps {
  patientId: string;
  patientName: string;
  dentistId: string;
  onUploadComplete?: () => void;
}

export function GoogleDriveUpload({ 
  patientId, 
  patientName, 
  dentistId, 
  onUploadComplete 
}: GoogleDriveUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name);
      }
      
      // Auto-detect document type based on file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension) {
        const typeMap: { [key: string]: string } = {
          'pdf': 'Medical Report',
          'jpg': 'X-Ray',
          'jpeg': 'X-Ray',
          'png': 'Photo',
          'doc': 'Treatment Plan',
          'docx': 'Treatment Plan',
        };
        setDocumentType(typeMap[extension] || 'Other');
      }
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:mime/type;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentName || !documentType) {
      toast({
        title: "Missing Information",
        description: "Please select a file and provide document details.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setErrorMessage("");

    try {
      // First, create the document record in the database
      const { data: documentData, error: dbError } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: patientId,
          dentist_id: dentistId,
          document_name: documentName,
          document_type: documentType,
          mime_type: selectedFile.type,
          file_size: selectedFile.size,
          is_synced: false,
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Convert file to base64 for upload
      const fileData = await convertFileToBase64(selectedFile);

      // Upload to Google Drive via edge function
      const { data, error } = await supabase.functions.invoke('google-drive-sync', {
        body: {
          action: 'upload',
          documentId: documentData.id,
          fileName: documentName,
          fileData: fileData,
          mimeType: selectedFile.type,
          patientName: patientName,
        },
      });

      if (error) {
        throw new Error(`Upload error: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadStatus('success');
      toast({
        title: "Upload Successful",
        description: "Document has been uploaded to Google Drive and synced to the database.",
      });

      // Reset form
      setSelectedFile(null);
      setDocumentName("");
      setDocumentType("");
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      onUploadComplete?.();

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setErrorMessage(error.message || 'An unexpected error occurred');
      toast({
        title: "Upload Failed",
        description: error.message || 'Failed to upload document to Google Drive.',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Cloud className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload to Google Drive
        </CardTitle>
        <CardDescription>
          Upload patient documents directly to Google Drive with automatic sync
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Select File</Label>
          <Input
            id="file-upload"
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
            disabled={isUploading}
          />
          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="document-name">Document Name</Label>
          <Input
            id="document-name"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            placeholder="Enter document name"
            disabled={isUploading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="document-type">Document Type</Label>
          <Input
            id="document-type"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            placeholder="e.g., X-Ray, Medical Report, Treatment Plan"
            disabled={isUploading}
          />
        </div>

        {uploadStatus === 'error' && errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {uploadStatus === 'success' && (
          <Alert className="border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Document uploaded successfully to Google Drive!
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !documentName || !documentType || isUploading}
          className="w-full"
        >
          {getStatusIcon()}
          {isUploading ? 'Uploading...' : 'Upload to Google Drive'}
        </Button>
      </CardContent>
    </Card>
  );
}