import { useState } from 'react';
import { ResponsiveWizardShell, StatePanel } from '../../components/parity';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

export function ReviewPage() {
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <ResponsiveWizardShell
      title="Leave a review"
      description="Capture a quick quality signal before the journey closes."
      footer={
        <Button onClick={() => setSubmitted(true)} type="button">
          Submit review
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <Button
              key={value}
              onClick={() => setRating(value)}
              type="button"
              variant={rating === value ? 'default' : 'outline'}
            >
              {value} stars
            </Button>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-notes">Review notes</Label>
          <Textarea
            aria-label="Review notes"
            id="review-notes"
            onChange={(event) => setNotes(event.target.value)}
            value={notes}
          />
        </div>
        {submitted ? (
          <StatePanel
            title="Thanks for submitting feedback."
            description={`Rating recorded${rating ? `: ${rating}/5.` : '.'}`}
            tone="muted"
          />
        ) : null}
      </div>
    </ResponsiveWizardShell>
  );
}
