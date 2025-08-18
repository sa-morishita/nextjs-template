CREATE TABLE "diaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"image_url" text,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"type" varchar(20) DEFAULT 'diary' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "sample_todos" RENAME TO "todos";--> statement-breakpoint
ALTER TABLE "todos" DROP CONSTRAINT "sample_todos_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "idx_sample_todos_user_id_completed";--> statement-breakpoint
ALTER TABLE "diaries" ADD CONSTRAINT "diaries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_diaries_user_id_status" ON "diaries" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_diaries_user_id_created_at" ON "diaries" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_diaries_type" ON "diaries" USING btree ("type");--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_todos_user_id_completed" ON "todos" USING btree ("user_id","completed");