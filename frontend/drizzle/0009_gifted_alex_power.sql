CREATE TABLE "club_followers" (
	"user_id" text,
	"club_id" integer,
	CONSTRAINT "club_followers_user_id_club_id_pk" PRIMARY KEY("user_id","club_id")
);
--> statement-breakpoint
ALTER TABLE "club_followers" ADD CONSTRAINT "club_followers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_followers" ADD CONSTRAINT "club_followers_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;