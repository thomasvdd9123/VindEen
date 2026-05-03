# Zoek-een-tuinman.be

Belgische B2B-directory voor tuinmannen (rebrandbaar naar elke verticaal).
Stack: React 18 + Vite + TypeScript, Tailwind/Shadcn, Wouter, TanStack Query,
Express (via `api/index.ts`), Supabase (Postgres + Auth), Mollie, Resend, Billit/Peppol.

## Documentatie

- 📖 **Schrijfstijl**: zie [`docs/brand-voice.md`](docs/brand-voice.md) — verplicht
  naslagwerk voor elke woordkeuze (UI, e-mails, info-pagina's, AI-prompts).
- 🏗️ **Architectuur & projectvoorkeuren**: zie [`replit.md`](replit.md).

## Lokaal draaien

```bash
npm install
npm run dev
```

De app draait op poort 5000 (Express + Vite op één poort).
