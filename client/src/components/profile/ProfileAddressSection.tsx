import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface AddressValues {
  officeStreet: string;
  officeNumber: string;
  officeTown: string;
  officePostcode: string;
  hideAddress: boolean;
}

interface Props {
  value: AddressValues;
  onChange: (key: keyof AddressValues, val: string | boolean) => void;
}

export function ProfileAddressSection({ value, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="border-b pb-2">
        <h3 className="text-lg font-semibold">Bedrijfsadres</h3>
        <p className="text-sm text-muted-foreground">
          Het adres waar je bedrijf gevestigd is
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="pas-street">Straat</Label>
          <Input
            id="pas-street"
            placeholder="Kerkstraat"
            value={value.officeStreet}
            onChange={e => onChange("officeStreet", e.target.value)}
            data-testid="input-office-street"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pas-number">Nr.</Label>
          <Input
            id="pas-number"
            placeholder="12"
            value={value.officeNumber}
            onChange={e => onChange("officeNumber", e.target.value)}
            data-testid="input-office-number"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="pas-postcode">Postcode</Label>
          <Input
            id="pas-postcode"
            placeholder="9000"
            value={value.officePostcode}
            onChange={e => onChange("officePostcode", e.target.value)}
            data-testid="input-office-postcode"
          />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="pas-town">Gemeente</Label>
          <Input
            id="pas-town"
            placeholder="Gent"
            value={value.officeTown}
            onChange={e => onChange("officeTown", e.target.value)}
            data-testid="input-office-town"
          />
        </div>
      </div>

      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label className="text-base cursor-pointer" htmlFor="pas-hide">
            Adres verbergen
          </Label>
          <p className="text-sm text-muted-foreground">
            Verberg je exacte adres op je profiel. Je gemeente blijft altijd zichtbaar.
          </p>
        </div>
        <Switch
          id="pas-hide"
          checked={value.hideAddress}
          onCheckedChange={v => onChange("hideAddress", v)}
          data-testid="switch-hide-address"
        />
      </div>
    </div>
  );
}
