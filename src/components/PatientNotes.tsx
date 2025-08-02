import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [newNote, setNewNote] = useState('');

  const addNote = () => {
    if (!newNote.trim()) return;
    
    const newNoteObj: PatientNote = {
      id: crypto.randomUUID(),
      content: newNote.trim(),
      created_at: new Date().toISOString()
    };
    setNotes((prev) => [newNoteObj, ...prev]);
    setNewNote('');
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
        {notes.length > 0 ? (
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