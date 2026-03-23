DO $$ BEGIN
 CREATE TYPE "ai_provider" AS ENUM('OPENAI', 'GEMINI');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "ai_provider_key_status" AS ENUM('active', 'invalid', 'revoked');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "ai_provider_keys" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "provider" "ai_provider" NOT NULL,
  "encrypted_key" text NOT NULL,
  "key_fingerprint" text NOT NULL,
  "status" "ai_provider_key_status" DEFAULT 'active' NOT NULL,
  "last_validated_at" timestamp,
  "last_used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ai_provider_keys_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade,
  CONSTRAINT "ai_provider_keys_user_provider_unique"
    UNIQUE ("user_id", "provider")
);

CREATE INDEX IF NOT EXISTS "ai_provider_keys_user_id_idx"
  ON "ai_provider_keys" ("user_id");

CREATE INDEX IF NOT EXISTS "ai_provider_keys_user_provider_idx"
  ON "ai_provider_keys" ("user_id", "provider");
