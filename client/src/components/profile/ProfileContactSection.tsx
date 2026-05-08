import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { siteConfig } from "@/lib/theme.config";
import type { Location } from "@shared/schema";

export interface ContactValues {
  name: string;
  email: string;
  telnr: string;
  website: string;
  locationId: string;
}

export interface ContactErrors {
  name?: string;
  email?: string;
  locationId?: string;
}

interface Props {
  value: ContactValues;
  onChange: (key: keyof ContactValues, val: string) => void;
  errors?: ContactErrors;
  vat?: string | null;
}

export function ProfileContactSection({ value, onChange, errors, vat }: Props) {
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  return (
    <div className="space-y-6">
      <div className="border-b pb-2">
        <h3 className="text-lg font-semibold">Bedrijfsgegevens</h3>
        <p className="text-sm text-muted-foreground">
          Basisgegevens en contactinformatie van je bedrijf{vat && <> ({vat})</>}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pcs-name">
          Bedrijfsnaam <span className="text-destructive">*</span>
        </Label>
        <Input
          id="pcs-name"
          placeholder="Jouw bedrijfsnaam"
          value={value.name}
          onChange={e => onChange("name", e.target.value)}
          data-testid="input-name"
        />
        {errors?.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="pcs-email">
            Contact email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="pcs-email"
            type="email"
            placeholder="email@voorbeeld.be"
            value={value.email}
            onChange={e => onChange("email", e.target.value)}
            data-testid="input-email"
          />
          {errors?.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pcs-telnr">Telefoonnummer</Label>
          <Input
            id="pcs-telnr"
            placeholder={siteConfig.placeholders.phone}
            value={value.telnr}
            onChange={e => onChange("telnr", e.target.value)}
            data-testid="input-phone"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pcs-website">Website</Label>
        <Input
          id="pcs-website"
          placeholder="https://www.jouwwebsite.be"
          value={value.website}
          onChange={e => onChange("website", e.target.value)}
          data-testid="input-website"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pcs-location">
          Regio <span className="text-destructive">*</span>
        </Label>
        <Select value={value.locationId} onValueChange={v => onChange("locationId", v)}>
          <SelectTrigger id="pcs-location" data-testid="select-location">
            <SelectValue placeholder="Selecteer regio" />
          </SelectTrigger>
          <SelectContent>
            {locations.map(loc => (
              <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">De regio waarin je hoofdzakelijk actief bent</p>
        {errors?.locationId && <p className="text-sm text-destructive">{errors.locationId}</p>}
      </div>
    </div>
  );
}
