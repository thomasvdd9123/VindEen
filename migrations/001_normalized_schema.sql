-- ============================================================================
-- 001_normalized_schema.sql
-- Volledig genormaliseerd schema voor het directory-platform.
-- Verticaal-agnostisch: geen Belgische/tuinmannen-specifieke enums of defaults
-- op tabel-niveau. Alle verticaal-keuzes leven in seed-data + site_config.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- DROP OLD SCHEMA (CASCADE alle relaties)
-- ============================================================================
-- Drop tabellen die we vervangen / opnieuw aanmaken
DROP TABLE IF EXISTS contact_requests CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscription_items CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS practicals CASCADE;
DROP TABLE IF EXISTS offices CASCADE;
DROP TABLE IF EXISTS profile_status_history CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS locations CASCADE;

-- Drop nieuwe tabel-namen voor het geval die al bestaan (idempotent re-run)
DROP TABLE IF EXISTS site_config CASCADE;
DROP TABLE IF EXISTS practitioner_verification_event CASCADE;
DROP TABLE IF EXISTS contact_request CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS payment_provider CASCADE;
DROP TABLE IF EXISTS profile_subscription CASCADE;
DROP TABLE IF EXISTS subscription_plan_offer CASCADE;
DROP TABLE IF EXISTS subscription_plan CASCADE;
DROP TABLE IF EXISTS billing_cycle CASCADE;
DROP TABLE IF EXISTS practical_answer_option CASCADE;
DROP TABLE IF EXISTS practical_answer_date CASCADE;
DROP TABLE IF EXISTS practical_answer_double CASCADE;
DROP TABLE IF EXISTS practical_answer_int CASCADE;
DROP TABLE IF EXISTS practical_answer_string CASCADE;
DROP TABLE IF EXISTS practical_answer CASCADE;
DROP TABLE IF EXISTS practical_option CASCADE;
DROP TABLE IF EXISTS practical_question CASCADE;
DROP TABLE IF EXISTS variable_type CASCADE;
DROP TABLE IF EXISTS profile_offered_service CASCADE;
DROP TABLE IF EXISTS profile_specialization CASCADE;
DROP TABLE IF EXISTS profile_service_category CASCADE;
DROP TABLE IF EXISTS profile_service_area CASCADE;
DROP TABLE IF EXISTS offered_service CASCADE;
DROP TABLE IF EXISTS specialization CASCADE;
DROP TABLE IF EXISTS service_category CASCADE;
DROP TABLE IF EXISTS service_area CASCADE;
DROP TABLE IF EXISTS profile CASCADE;
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS practitioner CASCADE;
DROP TABLE IF EXISTS practitioner_type CASCADE;
DROP TABLE IF EXISTS address CASCADE;

-- Oude enums droppen (zaten in shared/schema.ts)
DROP TYPE IF EXISTS account_role CASCADE;
DROP TYPE IF EXISTS verification_status CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS subscription_type CASCADE;
DROP TYPE IF EXISTS payment_frequency CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_provider CASCADE;
DROP TYPE IF EXISTS belgian_province CASCADE;
DROP TYPE IF EXISTS belgian_region CASCADE;
DROP TYPE IF EXISTS language CASCADE;
DROP TYPE IF EXISTS main_category CASCADE;
DROP TYPE IF EXISTS specialization_type CASCADE;

-- ============================================================================
-- CORE: address (vóór practitioner/profile zodat FK's resolven)
-- ============================================================================
CREATE TABLE address (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    street TEXT,
    number TEXT,
    municipality TEXT,
    postcode TEXT,           -- TEXT i.p.v. INT: NL/UK/CA/etc hebben alfanumeriek
    province TEXT,
    region TEXT,
    country TEXT,            -- GEEN default 'België' - komt uit site_config
    longitude DOUBLE PRECISION,
    latitude DOUBLE PRECISION,

    is_residential BOOLEAN DEFAULT false,
    show_address BOOLEAN DEFAULT true,

    valid_from DATE,
    valid_until DATE,

    created_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- CORE: practitioner_type, practitioner, admin
-- ============================================================================
CREATE TABLE practitioner_type (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE practitioner (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE NOT NULL,            -- referenties auth.users via app-laag
    practitioner_type_id UUID REFERENCES practitioner_type(id),
    billing_address_id UUID REFERENCES address(id),

    email TEXT,
    firstname TEXT,
    lastname TEXT,
    gender TEXT,
    birthdate DATE,

    show_age BOOLEAN DEFAULT false,
    subject_to_vat BOOLEAN DEFAULT false,
    vat TEXT,
    company_name TEXT,                            -- gevolgd vanaf accounts.company_name

    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- CORE: profile
-- ============================================================================
CREATE TABLE profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practitioner_id UUID NOT NULL REFERENCES practitioner(id) ON DELETE CASCADE,
    office_address_id UUID REFERENCES address(id),

    company_name TEXT,
    telnr TEXT,
    contact_email TEXT,

    title TEXT,
    introduction TEXT,
    logourl TEXT,
    imageurls TEXT[],
    websiteurl TEXT,
    has_website BOOLEAN DEFAULT false,

    is_active BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    verification_status TEXT DEFAULT 'PENDING',   -- PENDING/APPROVED/REJECTED, vrije TEXT i.p.v. enum

    view_count INTEGER DEFAULT 0,
    website_clicks INTEGER DEFAULT 0,

    slug TEXT UNIQUE NOT NULL,

    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_profile_practitioner ON profile(practitioner_id);
CREATE INDEX idx_profile_slug ON profile(slug);
CREATE INDEX idx_profile_public_active ON profile(is_active, is_public);

-- ============================================================================
-- VERIFICATION EVENT TRAIL (uit ER-diagram, ontbrak in DDL)
-- ============================================================================
CREATE TABLE practitioner_verification_event (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    reason TEXT,
    actor_admin_id UUID REFERENCES admin(id),
    created_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- SERVICE AREA (geografische dekking - 572 BE gemeentes seeded)
-- ============================================================================
CREATE TABLE service_area (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    municipality TEXT,
    postcode TEXT,
    province TEXT,
    region TEXT,
    country TEXT,
    slug TEXT UNIQUE,
    longitude DOUBLE PRECISION,
    latitude DOUBLE PRECISION,
    is_system_defined BOOLEAN DEFAULT true
);

CREATE INDEX idx_service_area_slug ON service_area(slug);
CREATE INDEX idx_service_area_postcode ON service_area(postcode);

CREATE TABLE profile_service_area (
    profile_id UUID REFERENCES profile(id) ON DELETE CASCADE,
    service_area_id UUID REFERENCES service_area(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, service_area_id)
);

-- ============================================================================
-- TAXONOMIE: service_category, specialization, offered_service + junctions
-- ============================================================================
CREATE TABLE service_category (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_system_defined BOOLEAN DEFAULT true
);

CREATE TABLE specialization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    service_category_id UUID REFERENCES service_category(id),
    sort_order INTEGER DEFAULT 0,
    is_system_defined BOOLEAN DEFAULT true
);

CREATE TABLE offered_service (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_system_defined BOOLEAN DEFAULT true
);

CREATE TABLE profile_service_category (
    profile_id UUID REFERENCES profile(id) ON DELETE CASCADE,
    service_category_id UUID REFERENCES service_category(id) ON DELETE CASCADE,
    is_main BOOLEAN DEFAULT false,
    PRIMARY KEY (profile_id, service_category_id)
);

CREATE TABLE profile_specialization (
    profile_id UUID REFERENCES profile(id) ON DELETE CASCADE,
    specialization_id UUID REFERENCES specialization(id) ON DELETE CASCADE,
    is_main BOOLEAN DEFAULT false,
    PRIMARY KEY (profile_id, specialization_id)
);

CREATE TABLE profile_offered_service (
    profile_id UUID REFERENCES profile(id) ON DELETE CASCADE,
    offered_service_id UUID REFERENCES offered_service(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, offered_service_id)
);

-- ============================================================================
-- PRACTICAL QUESTIONS (dynamische profielvelden - getypeerde answers)
-- ============================================================================
CREATE TABLE variable_type (
    key TEXT PRIMARY KEY                 -- INT, STRING, DOUBLE, DATE, BOOLEAN, OPTION
);

CREATE TABLE practical_question (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    field_type TEXT NOT NULL REFERENCES variable_type(key),
    is_multi BOOLEAN DEFAULT false,
    is_required BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE practical_option (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practical_question_id UUID NOT NULL REFERENCES practical_question(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    UNIQUE (practical_question_id, key)
);

CREATE TABLE practical_answer (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    practical_question_id UUID NOT NULL REFERENCES practical_question(id) ON DELETE CASCADE
);

CREATE INDEX idx_practical_answer_profile ON practical_answer(profile_id);

CREATE TABLE practical_answer_string (
    practical_answer_id UUID PRIMARY KEY REFERENCES practical_answer(id) ON DELETE CASCADE,
    value TEXT
);

CREATE TABLE practical_answer_int (
    practical_answer_id UUID PRIMARY KEY REFERENCES practical_answer(id) ON DELETE CASCADE,
    value INT
);

CREATE TABLE practical_answer_double (
    practical_answer_id UUID PRIMARY KEY REFERENCES practical_answer(id) ON DELETE CASCADE,
    value DOUBLE PRECISION
);

CREATE TABLE practical_answer_date (
    practical_answer_id UUID PRIMARY KEY REFERENCES practical_answer(id) ON DELETE CASCADE,
    value DATE
);

CREATE TABLE practical_answer_option (
    practical_answer_id UUID REFERENCES practical_answer(id) ON DELETE CASCADE,
    practical_option_id UUID REFERENCES practical_option(id) ON DELETE CASCADE,
    PRIMARY KEY (practical_answer_id, practical_option_id)
);

-- ============================================================================
-- BILLING & SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE billing_cycle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    interval TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE subscription_plan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    valid_from DATE,
    valid_until DATE
);

CREATE TABLE subscription_plan_offer (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_plan_id UUID NOT NULL REFERENCES subscription_plan(id) ON DELETE CASCADE,

    duration_in_years INT,
    discount_percentage INT,
    total_price DOUBLE PRECISION,

    is_popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    valid_from DATE,
    valid_until DATE
);

CREATE TABLE profile_subscription (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
    subscription_plan_offer_id UUID NOT NULL REFERENCES subscription_plan_offer(id),
    billing_cycle_id UUID NOT NULL REFERENCES billing_cycle(id),

    start_date DATE,
    end_date DATE,
    auto_renew BOOLEAN DEFAULT false,

    status TEXT DEFAULT 'PENDING',                -- PENDING, ACTIVE, EXPIRED, CANCELLED
    grace_period_until DATE,
    refunded_reason TEXT,

    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_profile_subscription_profile ON profile_subscription(profile_id);

-- ============================================================================
-- PAYMENTS
-- ============================================================================
CREATE TABLE payment_provider (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE payment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_subscription_id UUID NOT NULL REFERENCES profile_subscription(id) ON DELETE CASCADE,
    payment_provider_id UUID NOT NULL REFERENCES payment_provider(id),

    amount DOUBLE PRECISION NOT NULL,
    currency TEXT DEFAULT 'EUR',
    status TEXT DEFAULT 'PENDING',                -- PENDING, PAID, FAILED, REFUNDED

    -- Provider-side identifiers (Mollie/Stripe/etc)
    external_payment_id TEXT,
    external_invoice_id TEXT,
    invoice_url TEXT,
    refund_reason TEXT,
    paid_at TIMESTAMP,
    refunded_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_payment_external ON payment(external_payment_id);

-- ============================================================================
-- CONTACT REQUESTS
-- ============================================================================
CREATE TABLE contact_request (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,

    visitor_email TEXT,
    visitor_name TEXT,
    telnr TEXT,
    subject TEXT,
    message TEXT,

    created_at TIMESTAMP DEFAULT now()
);

-- ============================================================================
-- SITE_CONFIG (single-row defaults voor verticaal/land/currency/etc)
-- ============================================================================
CREATE TABLE site_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    site_name TEXT NOT NULL,
    site_tagline TEXT,
    support_email TEXT NOT NULL,

    default_country_code TEXT NOT NULL,
    default_country_name TEXT NOT NULL,
    default_region TEXT,
    default_language TEXT NOT NULL,

    default_currency_code TEXT NOT NULL,
    default_vat_percentage DOUBLE PRECISION NOT NULL,
    company_vat_number TEXT,
    company_legal_name TEXT,

    default_practitioner_type_id UUID REFERENCES practitioner_type(id),
    default_subscription_plan_id UUID REFERENCES subscription_plan(id),

    postcode_pattern TEXT,
    phone_pattern TEXT,
    phone_country_code TEXT,

    updated_at TIMESTAMP DEFAULT now()
);
