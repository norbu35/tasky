import { useTranslation } from 'react-i18next';
import { ResponsiveWizardShell } from '../../layout/parity';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

export function EditProfilePage() {
  const { t } = useTranslation();

  return (
    <ResponsiveWizardShell
      title={t('sharedPages.editProfile.title', 'Edit profile')}
      description={t(
        'sharedPages.editProfile.description',
        'Refresh your public details without leaving the core profile flow.',
      )}
      footer={
        <Button type="button">{t('sharedPages.editProfile.saveAction', 'Save profile')}</Button>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shared-edit-name">
            {t('sharedPages.editProfile.displayName', 'Display name')}
          </Label>
          <Input
            defaultValue={t('sharedPages.editProfile.defaultName', 'Tasky User')}
            id="shared-edit-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shared-edit-bio">{t('sharedPages.editProfile.bioLabel', 'Bio')}</Label>
          <Textarea
            defaultValue={t('sharedPages.editProfile.defaultBio', 'Reliable and responsive.')}
            id="shared-edit-bio"
          />
        </div>
      </div>
    </ResponsiveWizardShell>
  );
}
