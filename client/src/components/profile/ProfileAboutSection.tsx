import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/RichTextEditor";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

export interface AboutValues {
  introduction: string;
  description: string;
}

interface Props {
  value: AboutValues;
  onChange: (key: keyof AboutValues, val: string) => void;
  websiteUrl?: string;
  companyName?: string;
}

export function ProfileAboutSection({ value, onChange, websiteUrl, companyName }: Props) {
  const { toast } = useToast();
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiGenerate = async () => {
    if (!websiteUrl) {
      toast({ title: "Website vereist", description: "Vul eerst je website-adres in bovenaan.", variant: "destructive" });
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl, companyName }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Onbekende fout");
      }
      const data = await res.json();
      onChange("description", data.description);
      toast({ title: "✨ Beschrijving gegenereerd!", description: "Lees de tekst na en pas aan waar nodig." });
    } catch (e: any) {
      toast({ title: "AI generatie mislukt", description: e.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-2">
        <h3 className="text-lg font-semibold">Slagzin & Beschrijving</h3>
        <p className="text-sm text-muted-foreground">
          Vertel bezoekers wie je bent en wat je doet
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pas-intro">
          Slagzin <span className="text-muted-foreground font-normal text-xs">(optioneel)</span>
        </Label>
        <Input
          id="pas-intro"
          placeholder="bv. Familiebedrijf gespecialiseerd in regulier tuinonderhoud rond Leuven."
          value={value.introduction}
          onChange={e => onChange("introduction", e.target.value)}
          maxLength={200}
          data-testid="input-introduction"
        />
        <p className="text-sm text-muted-foreground">
          Één zin die verschijnt direct onder je bedrijfsnaam. Kort en krachtig — wie je bent en wat je doet.
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <Label htmlFor="pas-desc">
            Beschrijving <span className="text-muted-foreground font-normal text-xs">(optioneel, maar sterk aanbevolen)</span>
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={aiLoading}
            onClick={handleAiGenerate}
            data-testid="button-ai-generate"
          >
            {aiLoading
              ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
              : <Sparkles className="h-3 w-3 mr-1.5" />}
            Genereer met AI
          </Button>
        </div>
        <RichTextEditor
          value={value.description}
          onChange={v => onChange("description", v)}
          placeholder="Schrijf hier je beschrijving..."
          minHeight="250px"
          data-testid="input-description"
        />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Tips voor een goede beschrijving:</span>
        </p>
        <ul className="text-sm text-muted-foreground mt-0.5 space-y-1 list-disc list-inside">
          <li>Wie ben je? Familiebedrijf, solo of met een team? Hoeveel jaar ervaring?</li>
          <li>Welke diensten bied je precies aan? (bv. maaien, snoeien, aanleg, bemesting, vijvers)</li>
          <li>In welke regio's of gemeenten ben je actief?</li>
          <li>Wat maakt jou anders? (bv. milieuvriendelijk, eigen materiaal, vaste contactpersoon)</li>
          <li>Hoe werkt een samenwerking? (bv. vrijblijvend plaatsbezoek → persoonlijke prijsopgave)</li>
          <li>Schrijf in "wij" bij een team, in "ik" als soloondernemer.</li>
          <li className="font-medium text-foreground">Heb je een website? Gebruik de AI-knop hierboven — die leest je site en schrijft een unieke tekst.</li>
        </ul>
      </div>
    </div>
  );
}
