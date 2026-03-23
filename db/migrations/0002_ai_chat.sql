DO $$ BEGIN
 CREATE TYPE "public"."ai_message_role" AS ENUM('system', 'user', 'assistant');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
-->
CREATE TABLE IF NOT EXISTS "ai_conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"resource_id" text,
	"provider" "ai_provider" NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
-->
CREATE TABLE IF NOT EXISTS "ai_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"role" "ai_message_role" NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
-->
DO $$ BEGIN
 ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
-->
DO $$ BEGIN
 ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
-->
DO $$ BEGIN
 ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_ai_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
-->
CREATE INDEX IF NOT EXISTS "ai_conversations_user_id_idx" ON "ai_conversations" USING btree ("user_id");
-->
CREATE INDEX IF NOT EXISTS "ai_conversations_resource_id_idx" ON "ai_conversations" USING btree ("resource_id");
-->
CREATE INDEX IF NOT EXISTS "ai_conversations_updated_at_idx" ON "ai_conversations" USING btree ("updated_at");
-->
CREATE INDEX IF NOT EXISTS "ai_messages_conversation_id_idx" ON "ai_messages" USING btree ("conversation_id");
-->
CREATE INDEX IF NOT EXISTS "ai_messages_conversation_created_at_idx" ON "ai_messages" USING btree ("conversation_id","created_at");
