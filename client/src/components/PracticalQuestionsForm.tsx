import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { usePracticalQuestions, type PracticalQuestion } from "@/lib/usePracticalQuestions";

interface Props {
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  heading?: string;
}

// Single source of truth for rendering practical-question forms.
// Renders one component per FieldType (OPTION multi/single, INT, DOUBLE,
// STRING, DATE, BOOLEAN). Question/option set is fully data-driven from
// /api/practical-questions, so adding a new question in the DB requires no
// frontend changes.
export function PracticalQuestionsForm({ values, onChange, heading }: Props) {
  const { questions } = usePracticalQuestions();
  if (!questions.length) return null;

  const set = (k: string, v: any) => onChange({ ...values, [k]: v });

  const renderField = (q: PracticalQuestion) => {
    const v = values[q.camelKey];
    const tid = `practical-${q.camelKey}`;

    if (q.fieldType === "OPTION" && q.isMulti) {
      const arr: string[] = Array.isArray(v) ? v : [];
      return (
        <div className="flex flex-wrap gap-3">
          {q.options.map((o) => {
            const checked = arr.includes(o.name);
            return (
              <label key={o.id} className="flex items-center gap-2 text-sm" data-testid={`${tid}-${o.key}`}>
                <Checkbox
                  checked={checked}
                  onCheckedChange={(c) =>
                    set(q.camelKey, c ? [...arr, o.name] : arr.filter((x) => x !== o.name))
                  }
                />
                {o.name}
              </label>
            );
          })}
        </div>
      );
    }
    if (q.fieldType === "OPTION") {
      return (
        <RadioGroup value={v ?? ""} onValueChange={(val) => set(q.camelKey, val)}>
          {q.options.map((o) => (
            <div key={o.id} className="flex items-center gap-2">
              <RadioGroupItem value={o.name} id={`${tid}-${o.key}`} data-testid={`${tid}-${o.key}`} />
              <Label htmlFor={`${tid}-${o.key}`}>{o.name}</Label>
            </div>
          ))}
        </RadioGroup>
      );
    }
    if (q.fieldType === "INT" || q.fieldType === "DOUBLE") {
      return (
        <Input
          type="number"
          step={q.fieldType === "DOUBLE" ? "0.01" : "1"}
          value={v ?? ""}
          onChange={(e) => set(q.camelKey, e.target.value === "" ? undefined : Number(e.target.value))}
          data-testid={tid}
        />
      );
    }
    if (q.fieldType === "STRING") {
      return (
        <Input
          value={v ?? ""}
          onChange={(e) => set(q.camelKey, e.target.value)}
          data-testid={tid}
        />
      );
    }
    if (q.fieldType === "DATE") {
      return (
        <Input
          type="date"
          value={v ?? ""}
          onChange={(e) => set(q.camelKey, e.target.value)}
          data-testid={tid}
        />
      );
    }
    if (q.fieldType === "BOOLEAN") {
      return (
        <Switch
          checked={!!v}
          onCheckedChange={(c) => set(q.camelKey, c)}
          data-testid={tid}
        />
      );
    }
    return null;
  };

  return (
    <div className="space-y-4" data-testid="section-practicals">
      {heading && <h3 className="text-sm font-medium">{heading}</h3>}
      {questions.map((q) => (
        <div key={q.id} className="space-y-2">
          <Label>{q.name}{q.isRequired && <span className="text-destructive"> *</span>}</Label>
          {renderField(q)}
        </div>
      ))}
    </div>
  );
}
