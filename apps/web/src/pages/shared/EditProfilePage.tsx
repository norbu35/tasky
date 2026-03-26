import { ResponsiveWizardShell } from '../../components/parity';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

export function EditProfilePage() {
  return (
    <ResponsiveWizardShell
      title="Edit profile"
      description="Refresh your public details without leaving the core profile flow."
      footer={
        <Button type="button">
          Save profile
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shared-edit-name">Display name</Label>
          <Input defaultValue="Tasky User" id="shared-edit-name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shared-edit-bio">Bio</Label>
          <Textarea defaultValue="Reliable and responsive." id="shared-edit-bio" />
        </div>
      </div>
    </ResponsiveWizardShell>
  );
}
