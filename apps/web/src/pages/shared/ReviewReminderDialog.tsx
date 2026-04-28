import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

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
          <DialogTitle>{t('sharedPages.reviewReminder.title')}</DialogTitle>
          <DialogDescription id="review-reminder-description">
            {t('sharedPages.reviewReminder.description')}
          </DialogDescription>
        </DialogHeader>
        <Button onClick={() => onOpenChange(false)} type="button">
          {t('sharedPages.reviewReminder.remindAction')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
