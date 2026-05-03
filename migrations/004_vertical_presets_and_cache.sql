-- Migration 004: Vertical presets, theme_copy override, cache version + transactional apply
-- Addresses code-review blockers for Task #4 (admin panel afmaken):
--  * Move hardcoded presets out of api/index.ts into DB (no-deploy rebrand).
--  * Atomic vertical switch via Postgres function (single transaction, rollback on failure).
--  * Add site_config.theme_copy override (DB-driven copy for theme.config.ts pages).
--  * Add site_config.cache_version that public clients can use to invalidate cached config.

BEGIN;

-- 1. vertical_preset catalog --------------------------------------------------
CREATE TABLE IF NOT EXISTS vertical_preset (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  config jsonb NOT NULL,           -- {site_config:{}, categories:[], specializations:[], offered_services:[], practical_questions:[], theme_copy:{}}
  is_system_defined boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. site_config additions ----------------------------------------------------
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS theme_copy jsonb;
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS cache_version int NOT NULL DEFAULT 1;

-- Trigger to bump cache_version on any site_config update.
CREATE OR REPLACE FUNCTION bump_site_config_cache_version() RETURNS trigger AS $$
BEGIN
  IF NEW.cache_version IS NOT DISTINCT FROM OLD.cache_version THEN
    NEW.cache_version := COALESCE(OLD.cache_version, 0) + 1;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS site_config_cache_bump ON site_config;
CREATE TRIGGER site_config_cache_bump
  BEFORE UPDATE ON site_config
  FOR EACH ROW EXECUTE FUNCTION bump_site_config_cache_version();

-- 3. Transactional preset-apply function -------------------------------------
-- Replaces ANY catalog that is explicitly present in the preset config jsonb.
-- Catalogs that are absent are left untouched. Runs in a single transaction:
-- any error inside the function rolls back the entire apply.
CREATE OR REPLACE FUNCTION apply_vertical_preset(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_preset record;
  v_cfg jsonb;
  v_cat jsonb;
  v_spec jsonb;
  v_svc jsonb;
  v_q jsonb;
  v_opt jsonb;
  v_cat_id uuid;
  v_q_id uuid;
  v_categories_count int := 0;
  v_specs_count int := 0;
  v_services_count int := 0;
  v_questions_count int := 0;
  v_options_count int := 0;
  v_site_cfg_id uuid;
BEGIN
  SELECT * INTO v_preset FROM vertical_preset WHERE slug = p_slug;
  IF v_preset IS NULL THEN
    RAISE EXCEPTION 'Unknown vertical preset slug: %', p_slug;
  END IF;
  v_cfg := v_preset.config;

  -- 3a. Categories + specializations (always replace together when categories present)
  IF v_cfg ? 'categories' THEN
    DELETE FROM profile_specialization;
    DELETE FROM profile_service_category;
    DELETE FROM specialization;
    DELETE FROM service_category;

    FOR v_cat IN SELECT * FROM jsonb_array_elements(v_cfg->'categories') LOOP
      INSERT INTO service_category (name, slug, description, sort_order, is_system_defined)
      VALUES (
        v_cat->>'name',
        v_cat->>'slug',
        v_cat->>'description',
        COALESCE((v_cat->>'sortOrder')::int, 0),
        true
      );
      v_categories_count := v_categories_count + 1;
    END LOOP;

    IF v_cfg ? 'specializations' THEN
      FOR v_spec IN SELECT * FROM jsonb_array_elements(v_cfg->'specializations') LOOP
        SELECT id INTO v_cat_id FROM service_category WHERE slug = v_spec->>'categorySlug';
        IF v_cat_id IS NULL THEN
          RAISE EXCEPTION 'Specialization % references unknown categorySlug %', v_spec->>'slug', v_spec->>'categorySlug';
        END IF;
        INSERT INTO specialization (name, slug, description, service_category_id, sort_order, is_system_defined)
        VALUES (
          v_spec->>'name',
          v_spec->>'slug',
          v_spec->>'description',
          v_cat_id,
          COALESCE((v_spec->>'sortOrder')::int, 0),
          true
        );
        v_specs_count := v_specs_count + 1;
      END LOOP;
    END IF;
  END IF;

  -- 3b. Offered services (also vertical-specific). Schema heeft geen
  -- service_category_id kolom — offered_service is een vlakke catalogus.
  IF v_cfg ? 'offered_services' THEN
    DELETE FROM profile_offered_service;
    DELETE FROM offered_service;
    FOR v_svc IN SELECT * FROM jsonb_array_elements(v_cfg->'offered_services') LOOP
      INSERT INTO offered_service (name, slug, description, sort_order, is_system_defined)
      VALUES (
        v_svc->>'name',
        v_svc->>'slug',
        v_svc->>'description',
        COALESCE((v_svc->>'sortOrder')::int, 0),
        true
      );
      v_services_count := v_services_count + 1;
    END LOOP;
  END IF;

  -- 3c. Practical questions + options
  IF v_cfg ? 'practical_questions' THEN
    DELETE FROM practical_answer_option;
    DELETE FROM practical_answer_string;
    DELETE FROM practical_answer_int;
    DELETE FROM practical_answer_double;
    DELETE FROM practical_answer_date;
    DELETE FROM practical_answer_boolean;
    DELETE FROM practical_answer;
    DELETE FROM practical_option;
    DELETE FROM practical_question;
    FOR v_q IN SELECT * FROM jsonb_array_elements(v_cfg->'practical_questions') LOOP
      INSERT INTO practical_question (key, name, field_type, is_multi, is_required, sort_order)
      VALUES (
        v_q->>'key',
        v_q->>'name',
        UPPER(COALESCE(v_q->>'fieldType', 'STRING')),
        COALESCE((v_q->>'isMulti')::boolean, false),
        COALESCE((v_q->>'isRequired')::boolean, false),
        COALESCE((v_q->>'sortOrder')::int, 0)
      )
      RETURNING id INTO v_q_id;
      v_questions_count := v_questions_count + 1;
      IF v_q ? 'options' THEN
        FOR v_opt IN SELECT * FROM jsonb_array_elements(v_q->'options') LOOP
          INSERT INTO practical_option (practical_question_id, key, name, sort_order)
          VALUES (
            v_q_id,
            v_opt->>'key',
            v_opt->>'name',
            COALESCE((v_opt->>'sortOrder')::int, 0)
          );
          v_options_count := v_options_count + 1;
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- 3d. site_config: copy known scalar keys + theme_copy override
  SELECT id INTO v_site_cfg_id FROM site_config LIMIT 1;
  IF v_site_cfg_id IS NOT NULL AND v_cfg ? 'site_config' THEN
    UPDATE site_config SET
      site_name        = COALESCE(v_cfg->'site_config'->>'site_name',        site_name),
      site_tagline     = COALESCE(v_cfg->'site_config'->>'site_tagline',     site_tagline),
      support_email    = COALESCE(v_cfg->'site_config'->>'support_email',    support_email),
      default_language = COALESCE(v_cfg->'site_config'->>'default_language', default_language),
      default_country_code = COALESCE(v_cfg->'site_config'->>'default_country_code', default_country_code),
      default_country_name = COALESCE(v_cfg->'site_config'->>'default_country_name', default_country_name),
      default_currency_code = COALESCE(v_cfg->'site_config'->>'default_currency_code', default_currency_code),
      theme_copy = COALESCE(v_cfg->'theme_copy', theme_copy)
    WHERE id = v_site_cfg_id;
  ELSIF v_site_cfg_id IS NOT NULL AND v_cfg ? 'theme_copy' THEN
    UPDATE site_config SET theme_copy = v_cfg->'theme_copy' WHERE id = v_site_cfg_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'slug', p_slug,
    'label', v_preset.label,
    'categories', v_categories_count,
    'specializations', v_specs_count,
    'offered_services', v_services_count,
    'practical_questions', v_questions_count,
    'practical_options', v_options_count
  );
END;
$$;

-- 4. Seed the two built-in presets -------------------------------------------
INSERT INTO vertical_preset (slug, label, description, is_system_defined, sort_order, config) VALUES
('tuinmannen-be', 'Tuinmannen (België)', 'Tuinprofessionals in België', true, 1, '{
  "site_config": {
    "site_name": "Zoek-een-tuinman.be",
    "site_tagline": "Vind een professionele tuinman in jouw buurt",
    "support_email": "info@zoek-een-tuinman.be"
  },
  "theme_copy": {
    "businessType": "tuinman",
    "businessTypePlural": "tuinmannen",
    "businessTypeArticle": "een tuinman",
    "businessTypeProfessional": "tuinprofessional",
    "businessTypeProfessionalPlural": "tuinprofessionals"
  },
  "categories": [
    {"name":"Tuinonderhoud","slug":"tuinonderhoud","description":"Onderhoud van bestaande tuinen","sortOrder":1},
    {"name":"Tuinaanleg","slug":"tuinaanleg","description":"Aanleg van nieuwe tuinen","sortOrder":2},
    {"name":"Architect","slug":"architect","description":"Tuinarchitectuur en ontwerp","sortOrder":3}
  ],
  "specializations": [
    {"name":"Gras maaien","slug":"gras-maaien","categorySlug":"tuinonderhoud","description":"Professioneel gazon maaien","sortOrder":1},
    {"name":"Bomen snoeien","slug":"bomen-snoeien","categorySlug":"tuinonderhoud","description":"Vakkundige snoei van bomen","sortOrder":2},
    {"name":"Hagen knippen","slug":"hagen-knippen","categorySlug":"tuinonderhoud","description":"Hagen knippen en vormgeven","sortOrder":3},
    {"name":"Onkruid verwijderen","slug":"onkruid-verwijderen","categorySlug":"tuinonderhoud","description":"Onkruidbestrijding","sortOrder":4},
    {"name":"Paden & terrassen","slug":"paden-terrassen","categorySlug":"tuinaanleg","description":"Aanleg van paden en terrassen","sortOrder":5},
    {"name":"Beplanting","slug":"beplanting","categorySlug":"tuinaanleg","description":"Aanplanten van bomen, struiken en planten","sortOrder":6},
    {"name":"Vijvers","slug":"vijvers","categorySlug":"tuinaanleg","description":"Aanleg van vijvers en waterpartijen","sortOrder":7}
  ],
  "offered_services": [
    {"name":"Eenmalige opdracht","slug":"eenmalige-opdracht","description":"Losse tuinklus","sortOrder":1},
    {"name":"Periodiek onderhoud","slug":"periodiek-onderhoud","description":"Vast onderhoudscontract","sortOrder":2},
    {"name":"Advies / offerte","slug":"advies-offerte","description":"Vrijblijvende offerte","sortOrder":3}
  ],
  "practical_questions": [
    {"key":"has_van","name":"Heeft u een eigen bestelwagen?","fieldType":"BOOLEAN","isMulti":false,"isRequired":false,"sortOrder":1},
    {"key":"insurance","name":"Bent u verzekerd voor schade aan de tuin?","fieldType":"BOOLEAN","isMulti":false,"isRequired":true,"sortOrder":2}
  ]
}'::jsonb),
('kappers-be', 'Kappers (België)', 'Kappers en barbiers in België', true, 2, '{
  "site_config": {
    "site_name": "Zoek-een-kapper.be",
    "site_tagline": "Vind een professionele kapper in jouw buurt",
    "support_email": "info@zoek-een-kapper.be"
  },
  "theme_copy": {
    "businessType": "kapper",
    "businessTypePlural": "kappers",
    "businessTypeArticle": "een kapper",
    "businessTypeProfessional": "haarprofessional",
    "businessTypeProfessionalPlural": "haarprofessionals"
  },
  "categories": [
    {"name":"Dames","slug":"dameskapper","description":"Kappersdiensten voor dames","sortOrder":1},
    {"name":"Heren","slug":"herenkapper","description":"Kappersdiensten voor heren","sortOrder":2},
    {"name":"Kinderen","slug":"kinderkapper","description":"Kappersdiensten voor kinderen","sortOrder":3},
    {"name":"Barbier","slug":"barbier","description":"Barbierdiensten en baardverzorging","sortOrder":4}
  ],
  "specializations": [
    {"name":"Knippen dames","slug":"knippen-dames","categorySlug":"dameskapper","description":"Knipbeurt voor dames","sortOrder":1},
    {"name":"Kleuren","slug":"kleuren","categorySlug":"dameskapper","description":"Haarkleuring","sortOrder":2},
    {"name":"Highlights","slug":"highlights","categorySlug":"dameskapper","description":"Highlights en balayage","sortOrder":3},
    {"name":"Bruidskapsel","slug":"bruidskapsel","categorySlug":"dameskapper","description":"Kapsel voor bruiloft","sortOrder":4},
    {"name":"Knippen heren","slug":"knippen-heren","categorySlug":"herenkapper","description":"Klassieke herenknipbeurt","sortOrder":5},
    {"name":"Tondeuse / fade","slug":"tondeuse","categorySlug":"herenkapper","description":"Tondeuse / fade","sortOrder":6},
    {"name":"Kinderknip","slug":"kinderknip","categorySlug":"kinderkapper","description":"Knipbeurt voor kinderen","sortOrder":7},
    {"name":"Baard trimmen","slug":"baard-trimmen","categorySlug":"barbier","description":"Baard trimmen en stylen","sortOrder":8},
    {"name":"Scheren","slug":"scheren","categorySlug":"barbier","description":"Klassiek nat scheren","sortOrder":9}
  ],
  "offered_services": [
    {"name":"Knipbeurt op afspraak","slug":"knipbeurt-op-afspraak","description":"Behandeling op afspraak","sortOrder":1},
    {"name":"Walk-in","slug":"walk-in","description":"Zonder afspraak langskomen","sortOrder":2},
    {"name":"Aan huis","slug":"aan-huis","description":"Kapper komt aan huis","sortOrder":3}
  ],
  "practical_questions": [
    {"key":"accepts_walkin","name":"Accepteert u walk-ins?","fieldType":"BOOLEAN","isMulti":false,"isRequired":false,"sortOrder":1},
    {"key":"hair_type","name":"Welke haartypes behandelt u?","fieldType":"OPTION","isMulti":true,"isRequired":false,"sortOrder":2,"options":[
      {"key":"straight","name":"Steil","sortOrder":1},
      {"key":"curly","name":"Krullend","sortOrder":2},
      {"key":"afro","name":"Afro","sortOrder":3}
    ]}
  ]
}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  is_system_defined = EXCLUDED.is_system_defined,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

COMMIT;
