/**
 * Adds new practical questions to the database.
 * Usage: tsx scripts/seed-practical-questions.ts
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const questions = [
  {
    key: "PriceRange",
    name: "Richtprijs",
    field_type: "OPTION",
    is_multi: false,
    is_required: false,
    sort_order: 4,
    options: [
      { key: "OnRequest",   name: "Op aanvraag",   sort_order: 1 },
      { key: "Under30",     name: "< €30/u",        sort_order: 2 },
      { key: "Eur30to50",   name: "€30-50/u",       sort_order: 3 },
      { key: "Eur50to75",   name: "€50-75/u",       sort_order: 4 },
      { key: "Eur75to100",  name: "€75-100/u",      sort_order: 5 },
      { key: "Over100",     name: "> €100/u",       sort_order: 6 },
    ],
  },
  {
    key: "WaitingList",
    name: "Wachtlijst",
    field_type: "OPTION",
    is_multi: false,
    is_required: false,
    sort_order: 5,
    options: [
      { key: "None",          name: "Geen wachtlijst",       sort_order: 1 },
      { key: "LessThanWeek",  name: "Minder dan 1 week",     sort_order: 2 },
      { key: "OneToTwoWeeks", name: "1-2 weken",             sort_order: 3 },
      { key: "TwoToFourWeeks",name: "2-4 weken",             sort_order: 4 },
      { key: "OneToTwoMonths",name: "1-2 maanden",           sort_order: 5 },
      { key: "OverTwoMonths", name: "Meer dan 2 maanden",    sort_order: 6 },
    ],
  },
  {
    key: "ResponseTime",
    name: "Reactietijd op aanvragen",
    field_type: "OPTION",
    is_multi: false,
    is_required: false,
    sort_order: 6,
    options: [
      { key: "SameDay",    name: "Zelfde dag",       sort_order: 1 },
      { key: "Within24h",  name: "Binnen 24 uur",    sort_order: 2 },
      { key: "Within48h",  name: "Binnen 2 dagen",   sort_order: 3 },
      { key: "WithinWeek", name: "Binnen de week",   sort_order: 4 },
    ],
  },
  {
    key: "Availability",
    name: "Wanneer kan ik starten",
    field_type: "OPTION",
    is_multi: false,
    is_required: false,
    sort_order: 7,
    options: [
      { key: "Immediate",       name: "Direct beschikbaar",  sort_order: 1 },
      { key: "WithinOneWeek",   name: "Binnen 1 week",       sort_order: 2 },
      { key: "OneToTwoWeeks",   name: "1-2 weken",           sort_order: 3 },
      { key: "TwoToFourWeeks",  name: "2-4 weken",           sort_order: 4 },
      { key: "OverOneMonth",    name: "Meer dan 1 maand",    sort_order: 5 },
    ],
  },
  {
    key: "WorksWeekends",
    name: "Werkt in weekend",
    field_type: "BOOLEAN",
    is_multi: false,
    is_required: false,
    sort_order: 8,
    options: [],
  },
  {
    key: "Insured",
    name: "Verzekerd (BA)",
    field_type: "BOOLEAN",
    is_multi: false,
    is_required: false,
    sort_order: 9,
    options: [],
  },
  {
    key: "ProvidesEquipment",
    name: "Eigen materiaal en gereedschap",
    field_type: "BOOLEAN",
    is_multi: false,
    is_required: false,
    sort_order: 10,
    options: [],
  },
];

async function main() {
  for (const q of questions) {
    const { options, ...qData } = q;

    // Check if question already exists
    const { data: existing } = await supabase
      .from("practical_question")
      .select("id")
      .eq("key", q.key)
      .maybeSingle();

    let questionId: string;

    if (existing) {
      console.log(`⚠️  Question '${q.key}' already exists (id: ${(existing as any).id}), skipping insert.`);
      questionId = (existing as any).id;
    } else {
      const { data, error } = await supabase
        .from("practical_question")
        .insert(qData)
        .select("id")
        .single();
      if (error) {
        console.error(`❌ Failed to insert question '${q.key}':`, error.message);
        continue;
      }
      questionId = (data as any).id;
      console.log(`✅ Created question '${q.key}' (id: ${questionId})`);
    }

    for (const opt of options) {
      const { data: existingOpt } = await supabase
        .from("practical_option")
        .select("id")
        .eq("practical_question_id", questionId)
        .eq("key", opt.key)
        .maybeSingle();

      if (existingOpt) {
        console.log(`   ⚠️  Option '${opt.key}' already exists, skipping.`);
        continue;
      }

      const { error: optErr } = await supabase
        .from("practical_option")
        .insert({ ...opt, practical_question_id: questionId });

      if (optErr) {
        console.error(`   ❌ Failed to insert option '${opt.key}':`, optErr.message);
      } else {
        console.log(`   ✅ Created option '${opt.key}' → ${opt.name}`);
      }
    }
  }

  console.log("\nDone.");
}

main().catch((e) => { console.error(e); process.exit(1); });
