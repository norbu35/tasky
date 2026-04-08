import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { useTranslation } from 'react-i18next';

export function ReviewReminderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog modal={false} onOpenChange={onOpenChange} open={open}>
      <DialogContent aria-describedby="review-reminder-description">
        <DialogHeader>
          <DialogTitle>
            {t('sharedPages.reviewReminder.title', 'Leave a review reminder')}
          </DialogTitle>
          <DialogDescription id="review-reminder-description">
            {t(
              'sharedPages.reviewReminder.description',
              'Reviews help unlock the next booking without forcing a long form.',
            )}
          </DialogDescription>
        </DialogHeader>
        <Button onClick={() => onOpenChange(false)} type="button">
          {t('sharedPages.reviewReminder.remindAction', 'Remind me later')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
