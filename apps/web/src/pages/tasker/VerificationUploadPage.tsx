import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function VerificationUploadPage() {
  return (
    <ResponsiveDetailShell title="Upload verification documents" description="Upload the front and back of your ID card.">
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>Phase 1 keeps the upload step simple and reviewable.</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
