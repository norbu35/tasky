import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

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
          <DialogTitle>{t('customerPages.noShowReminder.title')}</DialogTitle>
          <DialogDescription>{t('customerPages.noShowReminder.description')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            {t('customerPages.noShowReminder.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
