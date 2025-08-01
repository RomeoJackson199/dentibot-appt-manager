import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface PatientNote {
  id: string;
  content: string;
  created_at: string;
}

interface PatientNotesProps {
  patientId: string;
  dentistId: string;
}

export default function PatientNotes({ patientId, dentistId }: PatientNotesProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [patientId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patient_notes')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    try {
      const { data, error } = await supabase
        .from('patient_notes')
        .insert({
          patient_id: patientId,
          dentist_id: dentistId,
          content: newNote.trim()
        })
        .select('*')
        .single();
      if (error) throw error;
      setNotes((prev) => [data, ...prev]);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: 'Error',
        description: 'Failed to add note',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a new note..."
          rows={3}
        />
        <Button onClick={addNote} disabled={!newNote.trim()} size="sm">
          Add Note
        </Button>
      </div>
      <ScrollArea className="h-60 pr-2">
        {loading ? (
          <div className="text-center text-muted-foreground">Loading notes...</div>
        ) : notes.length > 0 ? (
          <div className="space-y-2">
            {notes.map((note) => (
              <Card key={note.id}>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {new Date(note.created_at).toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">No notes yet</div>
        )}
      </ScrollArea>
    </div>
  );
}
