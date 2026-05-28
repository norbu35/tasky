import { Map, Marker } from 'pigeon-maps';
import { useTranslation } from 'react-i18next';

import { Label } from '../../ui/label';

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-2">
      <Label className="text-body-sm font-semibold text-foreground/90">
        {t('taskCreation.locationPicker.label')}
      </Label>
      <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-border shadow-elevated transition-shadow duration-300 hover:shadow-deep">
        <Map
          height={300}
          center={[lat, lng]}
          zoom={14}
          onClick={({ latLng }) => onChange(latLng[0], latLng[1])}
        >
          <Marker width={40} anchor={[lat, lng]} color="hsl(var(--primary))" />
        </Map>
      </div>
      <p className="text-caption text-muted-foreground mt-1 font-medium">
        {t('taskCreation.locationPicker.hint')}
      </p>
    </div>
  );
}
