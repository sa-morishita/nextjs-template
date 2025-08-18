ALTER TABLE "user" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lineUserId" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lineUserName" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "lastLoginAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_lineUserId_unique" UNIQUE("lineUserId");