import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';

type CustomerNoShowReminderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CustomerNoShowReminderDialog({
  open,
  onOpenChange,
}: CustomerNoShowReminderDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('customerPages.noShowReminder.title', 'No-show reminder')}</DialogTitle>
          <DialogDescription>
            {t(
              'customerPages.noShowReminder.description',
              'Remind the tasker that the booking is still active and the customer is waiting.',
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t('customerPages.noShowReminder.close', 'Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
