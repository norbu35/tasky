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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>No-show reminder</DialogTitle>
          <DialogDescription>
            Remind the tasker that the booking is still active and the customer is waiting.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
