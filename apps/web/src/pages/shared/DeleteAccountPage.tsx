import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/button';
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
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={confirmed}
            id="delete-confirm"
            onCheckedChange={(value) => setConfirmed(value === true)}
          />
          <Label htmlFor="delete-confirm">{t('sharedPages.deleteAccount.confirmLabel')}</Label>
        </div>
        <Button disabled={!confirmed} type="button" variant="destructive">
          {t('sharedPages.deleteAccount.deleteAction')}
        </Button>
      </div>
    </ResponsiveDetailShell>
  );
}
