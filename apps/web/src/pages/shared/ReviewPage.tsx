import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveWizardShell, StatePanel } from '../../components/parity';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

export function ReviewPage() {
  const { t } = useTranslation();
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <ResponsiveWizardShell
      title={t('sharedPages.review.title', 'Leave a review')}
      description={t('sharedPages.review.description', 'Capture a quick quality signal before the journey closes.')}
      footer={
        <Button onClick={() => setSubmitted(true)} type="button">
          {t('sharedPages.review.submitAction', 'Submit review')}
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
              {t('sharedPages.review.stars', '{{count}} stars', { count: value })}
            </Button>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-notes">{t('sharedPages.review.notesLabel', 'Review notes')}</Label>
          <Textarea
            aria-label={t('sharedPages.review.notesLabel', 'Review notes')}
            id="review-notes"
            onChange={(event) => setNotes(event.target.value)}
            value={notes}
          />
        </div>
        {submitted ? (
          <StatePanel
            title={t('sharedPages.review.thanksTitle', 'Thanks for submitting feedback.')}
            description={t('sharedPages.review.ratingRecorded', 'Rating recorded{{rating}}.', { rating: rating ? `: ${rating}/5` : '' })}
            tone="muted"
          />
        ) : null}
      </div>
    </ResponsiveWizardShell>
  );
}
