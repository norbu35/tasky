import { Map, Marker } from "pigeon-maps";
import { Label } from "../ui/label";

interface LocationPickerProps {
    lat: number;
    lng: number;
    onChange: (lat: number, lng: number) => void;
}

export function LocationPicker({lat, lng, onChange}: LocationPickerProps) {
    return (
        <div className="grid gap-2">
            <Label>Map Location</Label>
            <div className="h-[300px] w-full rounded-md overflow-hidden border border-border">
                <Map
                    height={300}
                    center={[lat, lng]}
                    zoom={14}
                    onClick={({latLng}) => onChange(latLng[0], latLng[1])}
                >
                    <Marker width={40} anchor={[lat, lng]} color="hsl(var(--primary))"/>
                </Map>
            </div>
            <p className="text-xs text-muted-foreground">Click on the map to place the location pin.</p>
        </div>
    );
}
