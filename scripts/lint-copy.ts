#!/usr/bin/env tsx
/**
 * lint-copy.ts — automatische merkstem-check voor zoek-een-tuinman.be
 *
 * Scant `client/src/lib/theme.config.ts` en alle pagina's in
 * `client/src/pages/**` op verboden termen uit `docs/brand-voice.md`
 * (sectie 5 + 6) en suggereert het toegestane alternatief.
 *
 * Gebruik:
 *   npx tsx scripts/lint-copy.ts            # check
 *   npx tsx scripts/lint-copy.ts --help     # uitleg
 *
 * Exit-code 0 = schoon, 1 = overtredingen gevonden.
 *
 * Escape-hatch: voeg `lint-copy-ignore-file` toe in een commentaar
 * bovenaan een bestand om dat bestand volledig over te slaan.
 */

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import ts from "typescript";

const ROOT = resolve(process.cwd());
const ALLOW_FILE_MARKER = "lint-copy-ignore-file";
const BASELINE_PATH = join(ROOT, "scripts/lint-copy.baseline.json");

interface Rule {
  pattern: RegExp;
  suggestion: string;
  // Wanneer true: alleen flaggen in korte, CTA-achtige strings
  // (bv. button-labels) — niet in lopende prose.
  ctaOnly?: boolean;
}

// Verboden termen uit docs/brand-voice.md — sectie 5 (woordenlijst) + sectie 6
// (AI-prompt-snippet, blokken WOORDKEUZE / TOON / CTA-MICROCOPY / E-MAILS).
//
// Regels gebruiken \b-woordgrenzen en zijn case-insensitive. Houd ze
// conservatief om false-positives in technische strings te beperken.
const RULES: Rule[] = [
  // Aanspreking — formele "u/uw" verboden (§3, §5, §6)
  // Lowercase "u" als losstaand woord (formeel persoonlijk vnw).
  { pattern: /\bu\b/g, suggestion: 'gebruik "je" (informeel, nooit "u")' },
  // Hoofdletter "U" alleen flaggen vóór een typisch Nederlands hulpwerkwoord,
  // zodat losse code-identifiers ("U", afkortingen) niet vals positief zijn.
  {
    pattern: /\bU\s+(bent|kan|kunt|heeft|hebt|moet|mag|zal|zult|wordt|krijgt|wilt|wil|zoekt|vindt|gaat|kunt)\b/g,
    suggestion: 'gebruik "je" (informeel, nooit "U")',
  },
  { pattern: /\buw\b/gi, suggestion: 'gebruik "jouw" / "je"' },
  { pattern: /\bgeachte\b/gi, suggestion: 'gebruik "Hallo {voornaam}"' },
  { pattern: /\bhet\s+platform\b/gi, suggestion: 'spreek namens "wij" / "we" / "ons"' },

  // Account / profiel
  { pattern: /\baccounts?\b/gi, suggestion: 'gebruik "profiel" / "profielen"' },

  // Inschrijven / aanmelden
  { pattern: /\bregistreren\b/gi, suggestion: 'gebruik "inschrijven"' },
  { pattern: /\bregistreer\b/gi, suggestion: 'gebruik "schrijf in"' },
  { pattern: /\bregistratie\b/gi, suggestion: 'gebruik "inschrijving"' },
  { pattern: /\binloggen\b/gi, suggestion: 'gebruik "aanmelden"' },
  { pattern: /\blog\s+in\b/gi, suggestion: 'gebruik "meld je aan"' },

  // Klant / bezoeker i.p.v. gebruiker / lead
  { pattern: /\bgebruikers?\b/gi, suggestion: 'gebruik "klant" / "bezoeker"' },
  { pattern: /\bleads?\b/gi, suggestion: 'gebruik "klant(en)" / "bezoeker(s)"' },

  // Gemeente i.p.v. stad / dorp
  { pattern: /\bdorp(en)?\b/gi, suggestion: 'gebruik "gemeente"' },
  { pattern: /\bstad\b/gi, suggestion: 'gebruik "gemeente"' },
  { pattern: /\bsteden\b/gi, suggestion: 'gebruik "gemeenten"' },

  // Belgisch standaard
  { pattern: /\binvoices?\b/gi, suggestion: 'gebruik "factuur" / "facturen"' },
  { pattern: /\brekeningen?\b/gi, suggestion: 'gebruik "factuur" / "facturen"' },
  { pattern: /\bvat\s*(number|nummer)?\b/gi, suggestion: 'gebruik "btw-nummer"' },

  // Tarief / prijs i.p.v. fee / kosten
  { pattern: /\bfees?\b/gi, suggestion: 'gebruik "tarief" / "prijs"' },
  { pattern: /\bkosten\b/gi, suggestion: 'gebruik "tarief" / "prijs"' },

  // Online zetten i.p.v. publiceren / activeren
  { pattern: /\bpubliceren\b/gi, suggestion: 'gebruik "online zetten"' },
  { pattern: /\bpubliceer\b/gi, suggestion: 'gebruik "zet online"' },
  { pattern: /\bactiveren\b/gi, suggestion: 'gebruik "online zetten"' },
  { pattern: /\bactiveer\b/gi, suggestion: 'gebruik "zet online"' },

  // Engels uit
  { pattern: /\bsubmit\b/gi, suggestion: 'gebruik "verstuur" / "stuur door"' },
  { pattern: /\bcancel\b/gi, suggestion: 'gebruik "annuleren"' },
  { pattern: /\bvendor[s]?\b/gi, suggestion: 'gebruik "tuinman" / "professional"' },
  { pattern: /\bservice\s+providers?\b/gi, suggestion: 'gebruik "tuinman" / "professional"' },
  { pattern: /\binquir(?:y|ies)\b/gi, suggestion: 'gebruik "bericht" / "berichten"' },
  { pattern: /\bmessages?\b/gi, suggestion: 'gebruik "bericht" / "berichten"' },
  { pattern: /\bneed\s+help\b/gi, suggestion: 'gebruik "Vragen?"' },
  { pattern: /\bnoreply\b/gi, suggestion: "gebruik een echte, menselijke afzender" },

  // CTA-microcopy (§4.4) — alleen flaggen in korte CTA-achtige strings,
  // niet in lopende prose (waar "zoeken" / "verzenden" gewoon werkwoord zijn).
  { pattern: /\bzoek(en)?\b/gi, suggestion: 'gebruik "Toon {plural}" als CTA', ctaOnly: true },
  { pattern: /\bverzenden\b/gi, suggestion: 'gebruik "Stuur mijn vraag door" / werkwoord + object', ctaOnly: true },
  { pattern: /\bversturen\b/gi, suggestion: 'gebruik "Stuur mijn vraag door" / werkwoord + object', ctaOnly: true },
  { pattern: /\bOK\b/g, suggestion: 'gebruik concrete CTA, bv. "Bewaar wijzigingen"', ctaOnly: true },

  // Marketing-superlatieven
  { pattern: /\bbeste\b/gi, suggestion: "geen superlatief — gebruik concrete cijfers of getuigenissen" },
  { pattern: /\bgrootste\b/gi, suggestion: "geen superlatief — gebruik concrete cijfers" },
  { pattern: /#1\b/g, suggestion: "geen #1-claim — gebruik concrete cijfers" },
  { pattern: /\brevolutionair\b/gi, suggestion: "beschrijf concreet voordeel i.p.v. superlatief" },

  // Werkwoorden — Belgisch / warm
  { pattern: /\bopslaan\b/gi, suggestion: 'gebruik "bewaren"' },
  { pattern: /\bdeleten\b/gi, suggestion: 'gebruik "verwijderen"' },
  { pattern: /\bwissen\b/gi, suggestion: 'gebruik "verwijderen"' },

  // Juridische zwaarwichtigheid (4.8)
  { pattern: /\balsmede\b/gi, suggestion: 'gebruik "en" / "ook"' },
  { pattern: /\bin\s+dit\s+kader\b/gi, suggestion: 'gebruik "hiervoor" / "hierbij"' },
  { pattern: /\bbetreffende\b/gi, suggestion: 'gebruik "over" / "rond"' },
];

// JSX-attributen die nooit user-facing copy bevatten (technisch, identifiers).
// Strings binnen deze attributen worden overgeslagen.
const SKIP_ATTRS = new Set([
  "data-testid",
  "className",
  "class",
  "href",
  "to",
  "src",
  "id",
  "key",
  "name",
  "type",
  "rel",
  "target",
  "role",
  "method",
  "action",
  "pattern",
  "autoComplete",
  "inputMode",
  "value",
  "htmlFor",
  "for",
  "style",
  "dangerouslySetInnerHTML",
  "viewBox",
  "fill",
  "stroke",
  "d",
  "xmlns",
  "as",
  "data-state",
  "data-orientation",
]);

// Properties in object-literals die typisch geen user-copy bevatten.
const SKIP_OBJECT_KEYS = new Set([
  "queryKey",
  "url",
  "href",
  "src",
  "path",
  "to",
  "id",
  "key",
  "slug",
  "icon",
  "iconName",
  "className",
  "color",
  "bg",
  "method",
  "test",
  "value", // value veld in <SelectItem>/options is meestal een identifier
]);

interface Violation {
  file: string;
  line: number;
  col: number;
  term: string;
  suggestion: string;
  excerpt: string;
}

function listFiles(dir: string, exts: string[], out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) listFiles(full, exts, out);
    else if (exts.some((e) => entry.endsWith(e))) out.push(full);
  }
  return out;
}

// Een string telt als "CTA-achtig" (button/link/label) wanneer hij kort is
// en niet als lopende zin oogt — zo blijven CTA-only-regels uit prose weg.
function isCtaLikeString(text: string): boolean {
  const t = text.trim();
  if (t.length === 0 || t.length > 30) return false;
  // Bevat zinsleestekens → waarschijnlijk lopende prose, geen CTA-label
  if (/[.!?]/.test(t)) return false;
  // Meer dan ~4 woorden → geen typische button-microcopy
  if (t.split(/\s+/).length > 4) return false;
  return true;
}

function checkText(
  file: string,
  text: string,
  baseLine: number,
  baseCol: number,
  violations: Violation[],
): void {
  const ctaLike = isCtaLikeString(text);
  for (const rule of RULES) {
    if (rule.ctaOnly && !ctaLike) continue;
    rule.pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.pattern.exec(text)) !== null) {
      const before = text.slice(0, m.index);
      const lines = before.split("\n");
      const lineOffset = lines.length - 1;
      const colOffset = lines[lines.length - 1].length;
      const start = Math.max(0, m.index - 25);
      const end = Math.min(text.length, m.index + m[0].length + 25);
      violations.push({
        file,
        line: baseLine + lineOffset,
        col: lineOffset === 0 ? baseCol + colOffset : colOffset + 1,
        term: m[0],
        suggestion: rule.suggestion,
        excerpt: text.slice(start, end).replace(/\s+/g, " ").trim(),
      });
    }
  }
}

function looksLikeTechnicalString(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  // URL paths, absolute URLs, mailto, query keys, MIME types, env names
  if (/^(\/|https?:\/\/|mailto:|tel:|data:|#|\?)/.test(t)) return true;
  if (/^[A-Z0-9_]+$/.test(t)) return true; // ENV-style constants
  // Bevat geen letters → puur technische waarde
  if (!/[a-zA-Z]/.test(t)) return true;
  return false;
}

function shouldSkipStringNode(node: ts.StringLiteralLike): boolean {
  const parent = node.parent;
  if (!parent) return false;
  if (looksLikeTechnicalString(node.text)) return true;

  // <X attr="..." />
  if (ts.isJsxAttribute(parent)) {
    const attrName = parent.name.getText();
    // alt, aria-label, title, placeholder zijn juist user-visible — scannen
    if (["alt", "aria-label", "title", "placeholder"].includes(attrName)) return false;
    if (SKIP_ATTRS.has(attrName)) return true;
    return false;
  }

  // { key: "..." }
  if (ts.isPropertyAssignment(parent) && parent.initializer === node) {
    const keyNode = parent.name;
    let keyName: string | undefined;
    if (ts.isIdentifier(keyNode) || ts.isStringLiteral(keyNode)) {
      keyName = keyNode.text;
    }
    if (keyName && SKIP_OBJECT_KEYS.has(keyName)) return true;
  }

  // import "..." / export ... from "..."
  if (
    ts.isImportDeclaration(parent) ||
    ts.isExportDeclaration(parent) ||
    ts.isImportSpecifier(parent) ||
    ts.isExternalModuleReference(parent)
  ) {
    return true;
  }

  // require("...") / import("...")
  if (ts.isCallExpression(parent)) {
    const callee = parent.expression.getText();
    if (callee === "require" || callee === "import") return true;
  }

  return false;
}

function scanTsFile(file: string, violations: Violation[]): void {
  const content = readFileSync(file, "utf8");
  if (content.includes(ALLOW_FILE_MARKER)) return;

  const source = ts.createSourceFile(
    file,
    content,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  function recordLiteralText(text: string, openPos: number) {
    // openPos = positie van de openingsquote; tekst start daarna
    const lc = source.getLineAndCharacterOfPosition(openPos + 1);
    checkText(file, text, lc.line + 1, lc.character + 1, violations);
  }

  function visit(node: ts.Node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!shouldSkipStringNode(node)) {
        recordLiteralText(node.text, node.getStart(source));
      }
      return;
    }
    if (ts.isJsxText(node)) {
      const lc = source.getLineAndCharacterOfPosition(node.getStart(source));
      checkText(file, node.text, lc.line + 1, lc.character + 1, violations);
      return;
    }
    if (ts.isTemplateExpression(node)) {
      recordLiteralText(node.head.text, node.head.getStart(source));
      for (const span of node.templateSpans) {
        recordLiteralText(span.literal.text, span.literal.getStart(source));
        ts.forEachChild(span.expression, visit);
      }
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}

interface BaselineEntry {
  file: string;
  line: number;
  term: string;
}

function loadBaseline(): Set<string> {
  if (!existsSync(BASELINE_PATH)) return new Set();
  try {
    const raw = readFileSync(BASELINE_PATH, "utf8");
    const parsed = JSON.parse(raw) as { violations?: BaselineEntry[] };
    const set = new Set<string>();
    for (const v of parsed.violations ?? []) {
      set.add(`${v.file}|${v.line}|${v.term.toLowerCase()}`);
    }
    return set;
  } catch (err) {
    console.error(`lint-copy: kon baseline niet lezen (${(err as Error).message})`);
    return new Set();
  }
}

function violationKey(v: Violation): string {
  return `${relative(ROOT, v.file)}|${v.line}|${v.term.toLowerCase()}`;
}

function writeBaseline(violations: Violation[]): void {
  const entries: BaselineEntry[] = violations.map((v) => ({
    file: relative(ROOT, v.file),
    line: v.line,
    term: v.term,
  }));
  // Stabiele sortering voor diff-vriendelijke baseline
  entries.sort((a, b) =>
    a.file.localeCompare(b.file) || a.line - b.line || a.term.localeCompare(b.term),
  );
  const data = {
    description:
      "Auto-gegenereerde baseline van bestaande copy-overtredingen. " +
      "Regenereren via `npx tsx scripts/lint-copy.ts --update-baseline` " +
      "wanneer je copy hebt opgeschoond. Nieuwe overtredingen breken de build wel.",
    generatedAt: new Date().toISOString(),
    count: entries.length,
    violations: entries,
  };
  writeFileSync(BASELINE_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(
      [
        "lint-copy — controleert merkstem (docs/brand-voice.md §5 + §6).",
        "",
        "Scant:",
        "  - client/src/lib/theme.config.ts",
        "  - client/src/pages/**/*.{ts,tsx}",
        "",
        "Geeft per overtreding bestand:regel:kolom, de term en het",
        "voorgestelde alternatief uit de woordenlijst.",
        "",
        "Vlaggen:",
        "  --update-baseline   schrijf huidige overtredingen weg als baseline",
        "                      (zodat enkel nieuwe overtredingen builds breken)",
        "  --no-baseline       negeer de baseline en rapporteer alles",
        "",
        `Sluit een bestand uit met de marker "${ALLOW_FILE_MARKER}" in een commentaar.`,
      ].join("\n"),
    );
    process.exit(0);
  }

  const updateBaseline = process.argv.includes("--update-baseline");
  const ignoreBaseline = process.argv.includes("--no-baseline");

  const targets: string[] = [];
  const themeConfig = join(ROOT, "client/src/lib/theme.config.ts");
  try {
    statSync(themeConfig);
    targets.push(themeConfig);
  } catch {
    // niet aanwezig — overslaan
  }
  listFiles(join(ROOT, "client/src/pages"), [".tsx", ".ts"], targets);

  const allViolations: Violation[] = [];
  for (const f of targets) scanTsFile(f, allViolations);

  if (updateBaseline) {
    writeBaseline(allViolations);
    console.log(
      `\u2713 lint-copy: baseline geüpdatet (${allViolations.length} bestaande overtredingen) → ${relative(ROOT, BASELINE_PATH)}`,
    );
    process.exit(0);
  }

  const baseline = ignoreBaseline ? new Set<string>() : loadBaseline();
  const newViolations = allViolations.filter(
    (v) => !baseline.has(violationKey(v)),
  );
  const baselined = allViolations.length - newViolations.length;

  if (newViolations.length === 0) {
    const baselineNote =
      baselined > 0
        ? ` (${baselined} bestaande overtreding(en) in baseline genegeerd)`
        : "";
    console.log(
      `\u2713 lint-copy: geen nieuwe verboden termen in ${targets.length} bestand(en)${baselineNote}.`,
    );
    process.exit(0);
  }

  // Groepeer per bestand voor leesbaarheid
  const byFile = new Map<string, Violation[]>();
  for (const v of newViolations) {
    const list = byFile.get(v.file) ?? [];
    list.push(v);
    byFile.set(v.file, list);
  }

  console.error(
    `\u2717 lint-copy: ${newViolations.length} nieuwe verboden term(en) in ${byFile.size} bestand(en)` +
      (baselined > 0 ? ` (+${baselined} in baseline genegeerd).\n` : ".\n"),
  );
  for (const [file, list] of byFile) {
    const rel = relative(ROOT, file);
    console.error(`  ${rel}`);
    for (const v of list) {
      console.error(`    ${v.line}:${v.col}  "${v.term}"  → ${v.suggestion}`);
      console.error(`        …${v.excerpt}…`);
    }
    console.error("");
  }
  console.error(
    `Tip: zie docs/brand-voice.md §5 voor de volledige woordenlijst.`,
  );
  console.error(
    `     Sluit een bestand uit met "${ALLOW_FILE_MARKER}" in een commentaar,`,
  );
  console.error(
    `     of regenereer de baseline via \`npm run lint:copy -- --update-baseline\` als je copy bewust opgeschoond hebt.`,
  );
  process.exit(1);
}

main();
