-- ============================================================================
-- 002: Volledig vertical-agnostic — country/tax als data, geen hardcoded EUR
-- ============================================================================

CREATE TABLE IF NOT EXISTS country (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,           -- ISO 3166-1 alpha-2 (BE, NL, FR, ...)
    name TEXT NOT NULL,                  -- België, Nederland, ...
    currency_code TEXT NOT NULL,         -- ISO 4217 (EUR, USD, ...)
    currency_symbol TEXT NOT NULL,       -- €, $, ...
    default_vat_percentage DOUBLE PRECISION NOT NULL,
    phone_country_code TEXT,             -- +32, +31
    postcode_pattern TEXT,
    is_active BOOLEAN DEFAULT true
);

INSERT INTO country (code, name, currency_code, currency_symbol, default_vat_percentage, phone_country_code, postcode_pattern)
VALUES
  ('BE', 'België', 'EUR', '€', 21.0, '+32', '^[0-9]{4}$'),
  ('NL', 'Nederland', 'EUR', '€', 21.0, '+31', '^[0-9]{4}\\s?[A-Z]{2}$'),
  ('FR', 'France',  'EUR', '€', 20.0, '+33', '^[0-9]{5}$'),
  ('DE', 'Deutschland','EUR','€', 19.0, '+49', '^[0-9]{5}$')
ON CONFLICT (code) DO NOTHING;

-- payment.currency: drop hardcoded default — currency komt per-payment uit site_config / country
ALTER TABLE payment ALTER COLUMN currency DROP DEFAULT;

-- site_config: link naar country in plaats van losse default_country_code/name
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS default_country_id UUID REFERENCES country(id);
UPDATE site_config sc
   SET default_country_id = c.id
  FROM country c
 WHERE c.code = sc.default_country_code
   AND sc.default_country_id IS NULL;
