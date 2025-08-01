import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIAssistantProps {
  currentText: string;
  onTextRewrite: (newText: string) => void;
  context?: string;
}

export default function AIAssistant({ currentText, onTextRewrite, context }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const { toast } = useToast();

  const handleRewrite = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter instructions for how to rewrite the text",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-text-rewriter', {
        body: {
          currentText,
          prompt,
          context
        }
      });

      if (error) throw error;

      if (data?.rewrittenText) {
        onTextRewrite(data.rewrittenText);
        setIsOpen(false);
        setPrompt('');
        toast({
          title: "Text Rewritten",
          description: "The text has been successfully rewritten"
        });
      }
    } catch (error: any) {
      console.error('Error rewriting text:', error);
      toast({
        title: "Error",
        description: "Failed to rewrite text",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Wand2 className="h-4 w-4 mr-2" />
          AI Rewrite
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Text Rewriter
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Current Text:</label>
            <div className="mt-1 p-3 bg-muted rounded-md text-sm max-h-32 overflow-y-auto">
              {currentText || "No text to rewrite"}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Instructions:</label>
            <Textarea
              placeholder="How should I rewrite this text? (e.g., 'Make it more professional', 'Simplify the language', 'Add more details')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRewrite} disabled={loading || !currentText}>
              {loading ? "Rewriting..." : "Rewrite"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}