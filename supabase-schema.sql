-- Supabase Schema for Tuinmanvinden.be Directory
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order)
DROP TABLE IF EXISTS practicals CASCADE;
DROP TABLE IF EXISTS offices CASCADE;
DROP TABLE IF EXISTS contact_requests CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscription_items CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS gardeners CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Drop existing enums
DROP TYPE IF EXISTS account_role CASCADE;
DROP TYPE IF EXISTS verification_status CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS subscription_type CASCADE;
DROP TYPE IF EXISTS payment_frequency CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_provider CASCADE;
DROP TYPE IF EXISTS contact_request_status CASCADE;
DROP TYPE IF EXISTS specialization_type CASCADE;

-- Create Enums
CREATE TYPE account_role AS ENUM ('ADMIN', 'MODERATOR', 'GARDENER');
CREATE TYPE verification_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE subscription_type AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'BASIC', 'PREMIUM');
CREATE TYPE payment_frequency AS ENUM ('MONTHLY', 'YEARLY');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE payment_provider AS ENUM ('MOLLIE', 'STRIPE', 'PAYPAL', 'BANKACCOUNT');
CREATE TYPE contact_request_status AS ENUM ('NEW', 'READ', 'REPLIED', 'ARCHIVED');
CREATE TYPE specialization_type AS ENUM (
  'BOOMVERZORGING',
  'TUINAANLEG',
  'ECOLOGISCH_TUINIEREN',
  'GAZONSPECIALIST',
  'STIJLSPECIALIST',
  'SNOEIEN',
  'ONDERHOUD',
  'VIJVERS',
  'BESTRATING',
  'AFSLUITINGEN'
);

-- Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Locations Table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  postcode TEXT NOT NULL,
  municipality TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  region TEXT,
  country TEXT NOT NULL DEFAULT 'België',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Gardeners Table (Account holders)
CREATE TABLE gardeners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  role account_role NOT NULL DEFAULT 'GARDENER',
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles Table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gardener_id UUID NOT NULL REFERENCES gardeners(id),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  telnr TEXT,
  website TEXT,
  has_website BOOLEAN DEFAULT false,
  description TEXT,
  introduction TEXT,
  title TEXT,
  education TEXT,
  specializations TEXT[],
  offered_services TEXT[],
  logo_url TEXT,
  image_urls TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verification_status verification_status DEFAULT 'PENDING',
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  rejection_reason TEXT,
  is_featured BOOLEAN DEFAULT false,
  seo_title TEXT,
  seo_description TEXT,
  category_id UUID REFERENCES categories(id),
  location_id UUID REFERENCES locations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Offices Table
CREATE TABLE offices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id),
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  town TEXT NOT NULL,
  municipality TEXT NOT NULL,
  postcode TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  country TEXT NOT NULL DEFAULT 'België',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Practicals Table
CREATE TABLE practicals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id),
  reachability TEXT,
  experience TEXT,
  languages TEXT[],
  tariff TEXT,
  accepted_payment_methods TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscription Plans Table
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type subscription_type NOT NULL,
  name TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  mollie_price_id TEXT,
  mollie_product_id TEXT,
  general_info TEXT,
  features TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscription Items Table
CREATE TABLE subscription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  gardener_id UUID NOT NULL REFERENCES gardeners(id),
  subscription_plan_id UUID REFERENCES subscription_plans(id),
  mollie_subscription_id TEXT,
  mollie_customer_id TEXT,
  mollie_payment_id TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  payment_frequency payment_frequency DEFAULT 'YEARLY',
  status subscription_status NOT NULL DEFAULT 'ACTIVE',
  mail_invoice BOOLEAN DEFAULT true,
  grace_period_until TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_item_id UUID REFERENCES subscription_items(id),
  amount DOUBLE PRECISION NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status payment_status NOT NULL DEFAULT 'PENDING',
  provider payment_provider NOT NULL DEFAULT 'MOLLIE',
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mollie_payment_intent_id TEXT,
  mollie_invoice_id TEXT,
  invoice_url TEXT,
  invoice_pdf_url TEXT,
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contact Requests Table
CREATE TABLE contact_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gardener_id UUID NOT NULL REFERENCES gardeners(id),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  visitor_name TEXT NOT NULL,
  visitor_email TEXT NOT NULL,
  telnr TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status contact_request_status NOT NULL DEFAULT 'NEW',
  gardener_read_at TIMESTAMPTZ,
  admin_notified BOOLEAN DEFAULT false,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_category ON profiles(category_id);
CREATE INDEX idx_profiles_location ON profiles(location_id);
CREATE INDEX idx_profiles_gardener ON profiles(gardener_id);
CREATE INDEX idx_profiles_slug ON profiles(slug);
CREATE INDEX idx_profiles_active_public ON profiles(is_active, is_public);
CREATE INDEX idx_profiles_featured ON profiles(is_featured);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_locations_slug ON locations(slug);

-- Enable Row Level Security (optional, for production)
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE gardeners ENABLE ROW LEVEL SECURITY;
