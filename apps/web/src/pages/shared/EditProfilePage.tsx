import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
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
      footer={
        <Button type="button" className="px-8">
          <Save className="mr-2 h-4 w-4" />
          {t('sharedPages.editProfile.saveAction')}
        </Button>
      }
    >
      <Card>
        <CardHeader className="pb-5">
          <p className="text-base font-display font-semibold tracking-tight">
            {t('sharedPages.editProfile.cardHeading')}
          </p>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label
              htmlFor="shared-edit-name"
              className="text-badge-text font-semibold uppercase tracking-caps text-muted-foreground"
            >
              {t('sharedPages.editProfile.displayName')}
            </Label>
            <Input defaultValue={t('sharedPages.editProfile.defaultName')} id="shared-edit-name" />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="shared-edit-bio"
              className="text-badge-text font-semibold uppercase tracking-caps text-muted-foreground"
            >
              {t('sharedPages.editProfile.bioLabel')}
            </Label>
            <Textarea defaultValue={t('sharedPages.editProfile.defaultBio')} id="shared-edit-bio" />
          </div>
        </CardContent>
      </Card>
    </ResponsiveWizardShell>
  );
}
