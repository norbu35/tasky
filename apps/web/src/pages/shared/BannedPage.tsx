import { StatePanel } from '../../components/parity';
import { ScreenFrame } from '../../layout/ScreenFrame';

export function BannedPage() {
  return (
    <ScreenFrame maxWidth="narrow">
      <StatePanel
        title="Account banned"
        description="This account can no longer access the marketplace."
        tone="destructive"
      />
    </ScreenFrame>
  );
}
