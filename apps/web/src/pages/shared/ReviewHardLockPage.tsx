import { StatePanel } from '../../components/parity';
import { ScreenFrame } from '../../layout/ScreenFrame';

export function ReviewHardLockPage() {
  return (
    <ScreenFrame maxWidth="narrow">
      <StatePanel
        title="Reviews required"
        description="Complete the pending review before continuing with new bookings."
        tone="warning"
      />
    </ScreenFrame>
  );
}
