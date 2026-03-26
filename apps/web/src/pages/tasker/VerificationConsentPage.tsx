import { ResponsiveDetailShell } from '../../components/parity/ResponsiveDetailShell';
import { Card, CardContent } from '../../components/ui/card';

export function VerificationConsentPage() {
  return (
    <ResponsiveDetailShell title="Verification consent" description="Confirm the verification policy before uploading documents.">
      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>By continuing, you confirm that the uploaded documents belong to you.</p>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
