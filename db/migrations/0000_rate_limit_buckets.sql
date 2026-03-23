CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
  "bucket_key" text PRIMARY KEY NOT NULL,
  "policy_id" text NOT NULL,
  "request_count" integer DEFAULT 0 NOT NULL,
  "reset_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "rate_limit_policy_reset_idx"
  ON "rate_limit_buckets" ("policy_id", "reset_at");
