import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';

export function ReviewReminderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog modal={false} onOpenChange={onOpenChange} open={open}>
      <DialogContent aria-describedby="review-reminder-description">
        <DialogHeader>
          <DialogTitle>Leave a review reminder</DialogTitle>
          <DialogDescription id="review-reminder-description">
            Reviews help unlock the next booking without forcing a long form.
          </DialogDescription>
        </DialogHeader>
        <Button onClick={() => onOpenChange(false)} type="button">
          Remind me later
        </Button>
      </DialogContent>
    </Dialog>
  );
}
