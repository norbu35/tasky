import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { ResponsiveDetailShell } from '../../layout/parity';

export function DeleteAccountPage() {
  const { t } = useTranslation();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <ResponsiveDetailShell
      title={t('sharedPages.deleteAccount.title')}
      description={t('sharedPages.deleteAccount.description')}
    >
      <Card className="border-destructive/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-base font-display font-semibold text-destructive">
              {t('sharedPages.deleteAccount.title')}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="rounded-xl bg-destructive/5 p-4 ring-1 ring-inset ring-destructive/15">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={confirmed}
                id="delete-confirm"
                onCheckedChange={(value) => setConfirmed(value === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="delete-confirm"
                className="text-body-sm text-foreground leading-relaxed"
              >
                {t('sharedPages.deleteAccount.confirmLabel')}
              </Label>
            </div>
          </div>
          <Button
            disabled={!confirmed}
            type="button"
            variant="destructive"
            className="w-full sm:w-auto"
          >
            {t('sharedPages.deleteAccount.deleteAction')}
          </Button>
        </CardContent>
      </Card>
    </ResponsiveDetailShell>
  );
}
