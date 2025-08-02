import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

interface TreatmentStep {
  id: string;
  title: string;
  completed: boolean;
}

interface TreatmentPlanStepsProps {
  planId: string;
}

export default function TreatmentPlanSteps({ planId }: TreatmentPlanStepsProps) {
  const [steps, setSteps] = useState<TreatmentStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStep, setNewStep] = useState('');

  useEffect(() => {
    fetchSteps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const fetchSteps = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('treatment_plans')
      .select('treatment_steps')
      .eq('id', planId)
      .single();
    if (data) {
      setSteps((data as any).treatment_steps || []);
    }
    setLoading(false);
  };

  const updateSteps = async (updated: TreatmentStep[]) => {
    setSteps(updated);
    await supabase
      .from('treatment_plans')
      .update({ treatment_steps: updated as any })
      .eq('id', planId);
  };

  const addStep = async () => {
    if (!newStep.trim()) return;
    const newEntry: TreatmentStep = {
      id: Math.random().toString(36).slice(2, 9),
      title: newStep.trim(),
      completed: false,
    };
    const updated = [...steps, newEntry];
    setNewStep('');
    await updateSteps(updated);
  };

  const toggleStep = async (id: string) => {
    const updated = steps.map((s) =>
      s.id === id ? { ...s, completed: !s.completed } : s
    );
    await updateSteps(updated);
  };

  if (loading) return <p>Loading steps...</p>;

  return (
    <div className="space-y-2">
      {steps.map((step) => (
        <div key={step.id} className="flex items-center gap-2">
          <Checkbox
            checked={step.completed}
            onCheckedChange={() => toggleStep(step.id)}
          />
          <span className={step.completed ? 'line-through text-muted-foreground' : ''}>
            {step.title}
          </span>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <Input
          value={newStep}
          onChange={(e) => setNewStep(e.target.value)}
          placeholder="New step"
          className="h-8"
        />
        <Button size="sm" onClick={addStep} disabled={!newStep.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}
