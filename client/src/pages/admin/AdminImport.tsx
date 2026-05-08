import { useRef, useState, useEffect } from "react";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { authFetch } from "@/lib/queryClient";
import { Upload, FileText, CheckCircle2, XCircle, Download, Loader2, AlertTriangle } from "lucide-react";

interface ImportResult {
  row: number;
  status: "ok" | "error";
  slug?: string;
  error?: string;
}

interface ImportResponse {
  imported: number;
  errors: number;
  results: ImportResult[];
}

const TEMPLATE_CSV = `company_name,slug,contact_email,telnr,website,vat,street,number,postcode,municipality,service_areas,specializations,main_categories,title,introduction,is_public,is_claimed
"Tuinen De Vos","tuinen-de-vos","info@tuinendevos.be","0491 23 45 67","https://tuinendevos.be","BE0123456789","Kerkstraat","14","3000","Leuven","leuven|aarschot|diest","gras-maaien|hagen-knippen|bomen-snoeien","tuinonderhoud","Tuinonderhoud in de regio Leuven","Tuinen De Vos is een professioneel tuinbedrijf gespecialiseerd in onderhoud van particuliere en zakelijke tuinen in de regio Leuven. Met meer dan 10 jaar ervaring zorgen wij voor een verzorgde tuin het hele jaar door.","false","false"
"Groenaanleg Peeters","","info@peeters-groenaanleg.be","016 44 55 66","https://peeters-groenaanleg.be","BE0987654321","Tiensestraat","82B","3000","Leuven","leuven|tienen|landen","beplanting|paden-terrassen|vijvers","tuinaanleg","Tuinaanleg en groene projecten","Groenaanleg Peeters ontwerpt en legt tuinen aan op maat van de klant. Van een intiem stadsterrasje tot een grote landschapstuin — wij realiseren uw groene droom.","false","false"
"Vermeersch Hoveniers","","vermeersch@hoveniers.be","09 234 56 78","","BE0456789012","Gentsesteenweg","1","9000","Gent","gent|aalst|oudenaarde","gras-maaien|onkruid-verwijderen|hagen-knippen","tuinonderhoud","Professioneel tuinonderhoud Gent","Vermeersch Hoveniers verzorgt uw tuin vakkundig en betrouwbaar. Wij werken voor particulieren en kleine bedrijven in de regio Gent.","false","false"`;

export default function AdminImport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = e => setCsvText((e.target?.result as string) || "");
    reader.readAsText(file, "utf-8");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!csvText.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    try {
      const res = await authFetch("/api/admin/import-profiles", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: csvText,
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Import mislukt"); return; }
      setResult(json);
    } catch (e: any) {
      setError(e.message || "Onbekende fout");
    } finally {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "import-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const previewRows = csvText
    ? csvText.split("\n").filter(l => l.trim() && !l.startsWith("#")).slice(0, 6)
    : [];

  const rowCount = csvText
    ? csvText.split("\n").filter(l => l.trim() && !l.startsWith("#")).length - 1
    : 0;

  return (
    <AdminLayout title="Profielen importeren" description="Bulk-import van profielen via CSV">
      {/* Template download */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            CSV-template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Download het template, vul de gegevens in (één rij per bedrijf) en upload het hieronder.
            Lege kolommen mag je leeg laten. Afbeeldingen voeg je achteraf toe via het profiel.
          </p>
          <div className="rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto whitespace-nowrap text-muted-foreground">
            company_name · slug · contact_email · telnr · website · vat · street · number · postcode · municipality · service_areas · specializations · main_categories · title · introduction · is_public · is_claimed
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="font-medium mb-1">Pipe-gescheiden arrays:</p>
              <ul className="text-muted-foreground space-y-0.5 text-xs">
                <li><strong>specializations</strong>: gras-maaien|hagen-knippen|vijvers</li>
                <li><strong>main_categories</strong>: tuinonderhoud|tuinaanleg</li>
                <li><strong>service_areas</strong>: leuven|brussel|gent (slug of postcode)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Beschikbare specialisaties:</p>
              <ul className="text-muted-foreground space-y-0.5 text-xs">
                <li>gras-maaien · hagen-knippen · bomen-snoeien</li>
                <li>onkruid-verwijderen · beplanting</li>
                <li>paden-terrassen · vijvers</li>
              </ul>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2" data-testid="btn-download-template">
            <Download className="h-4 w-4" />
            Template downloaden (CSV)
          </Button>
        </CardContent>
      </Card>

      {/* Upload zone */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            CSV uploaden
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            data-testid="dropzone-csv"
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">{fileName || "Sleep je CSV hier naartoe of klik om te selecteren"}</p>
            <p className="text-sm text-muted-foreground mt-1">Alleen .csv bestanden</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            data-testid="input-csv-file"
          />

          {/* Preview */}
          {previewRows.length > 0 && (
            <div className="rounded-md border overflow-x-auto">
              <table className="text-xs w-full">
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className={i === 0 ? "bg-muted font-medium" : "border-t"}>
                      {row.split(",").slice(0, 8).map((cell, j) => (
                        <td key={j} className="px-2 py-1.5 max-w-[160px] truncate">
                          {cell.replace(/^"|"$/g, "")}
                        </td>
                      ))}
                      {row.split(",").length > 8 && <td className="px-2 py-1.5 text-muted-foreground">…</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground px-3 py-2 border-t">
                {previewRows.length - 1} rij(en) gevonden (preview: eerste 8 kolommen)
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive" data-testid="import-error">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {loading && (
            <div className="rounded-md bg-muted border p-4 space-y-2" data-testid="import-progress">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                Bezig met importeren… ({elapsed}s verstreken)
              </div>
              <p className="text-xs text-muted-foreground">
                Elke rij wordt apart verwerkt in de database. Bij {rowCount} rijen kan dit {Math.ceil(rowCount * 0.6)}–{Math.ceil(rowCount * 1.2)} seconden duren. Sluit dit venster <strong>niet</strong>.
              </p>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={!csvText.trim() || loading}
            className="gap-2"
            data-testid="btn-start-import"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {loading ? `Importeren… (${elapsed}s)` : `Importeren starten${rowCount > 0 ? ` (${rowCount} rijen)` : ""}`}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card data-testid="import-results">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {result.errors === 0
                ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                : <AlertTriangle className="h-4 w-4 text-amber-500" />}
              Resultaat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-semibold">{result.imported}</span>
                <span className="text-sm">geïmporteerd</span>
              </div>
              {result.errors > 0 && (
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" />
                  <span className="font-semibold">{result.errors}</span>
                  <span className="text-sm">mislukt</span>
                </div>
              )}
            </div>
            <div className="rounded-md border overflow-hidden">
              <table className="text-sm w-full">
                <thead>
                  <tr className="bg-muted text-muted-foreground text-xs">
                    <th className="text-left px-3 py-2">Rij</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Slug / Fout</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map(r => (
                    <tr key={r.row} className="border-t">
                      <td className="px-3 py-2 text-muted-foreground">{r.row}</td>
                      <td className="px-3 py-2">
                        {r.status === "ok"
                          ? <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">OK</Badge>
                          : <Badge variant="destructive">Fout</Badge>}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {r.status === "ok"
                          ? <a href={`/admin/profielen`} className="text-primary hover:underline">{r.slug}</a>
                          : <span className="text-destructive">{r.error}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.errors === 0 && (
              <p className="text-sm text-muted-foreground">
                Alle profielen staan op <strong>niet-publiek</strong> en <strong>is_claimed=false</strong>.
                Ga naar <a href="/admin/profielen" className="text-primary hover:underline">Profielen</a> om ze te bekijken en goed te keuren.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
