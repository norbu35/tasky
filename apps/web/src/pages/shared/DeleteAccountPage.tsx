import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ResponsiveDetailShell } from '../../components/parity';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';

export function DeleteAccountPage() {
  const { t } = useTranslation();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <ResponsiveDetailShell
      title={t('sharedPages.deleteAccount.title', 'Delete account')}
      description={t(
        'sharedPages.deleteAccount.description',
        'This action is permanent and should stay frictionful.',
      )}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={confirmed}
            id="delete-confirm"
            onCheckedChange={(value) => setConfirmed(value === true)}
          />
          <Label htmlFor="delete-confirm">
            {t(
              'sharedPages.deleteAccount.confirmLabel',
              'I understand that my account and history will be removed.',
            )}
          </Label>
        </div>
        <Button disabled={!confirmed} type="button" variant="destructive">
          {t('sharedPages.deleteAccount.deleteAction', 'Delete permanently')}
        </Button>
      </div>
    </ResponsiveDetailShell>
  );
}
