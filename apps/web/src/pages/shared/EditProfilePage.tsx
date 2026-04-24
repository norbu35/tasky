import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { ResponsiveWizardShell } from '../../layout/parity';

export function EditProfilePage() {
  const { t } = useTranslation();

  return (
    <ResponsiveWizardShell
      title={t('sharedPages.editProfile.title')}
      description={t('sharedPages.editProfile.description')}
      footer={<Button type="button">{t('sharedPages.editProfile.saveAction')}</Button>}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shared-edit-name">{t('sharedPages.editProfile.displayName')}</Label>
          <Input defaultValue={t('sharedPages.editProfile.defaultName')} id="shared-edit-name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shared-edit-bio">{t('sharedPages.editProfile.bioLabel')}</Label>
          <Textarea defaultValue={t('sharedPages.editProfile.defaultBio')} id="shared-edit-bio" />
        </div>
      </div>
    </ResponsiveWizardShell>
  );
}
