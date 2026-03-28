CREATE TABLE `answers` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`text` text NOT NULL,
	`is_correct` integer DEFAULT false NOT NULL,
	`order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exam_resets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`test_id` text NOT NULL,
	`reset_by` text NOT NULL,
	`reset_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`chat_type` text NOT NULL,
	`sender_id` text NOT NULL,
	`receiver_id` text,
	`text` text,
	`attachment` text,
	`is_deleted` integer DEFAULT false,
	`scheduled_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`test_id` text NOT NULL,
	`text` text NOT NULL,
	`type` text DEFAULT 'single' NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	`explanation` text
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`test_id` text NOT NULL,
	`rating_type` text NOT NULL,
	`score` real NOT NULL,
	`grade` text,
	`position` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `test_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`test_id` text NOT NULL,
	`score` real,
	`total_questions` integer,
	`correct_answers` integer,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`answers` text
);
--> statement-breakpoint
CREATE TABLE `tests` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`author_id` text NOT NULL,
	`type` text DEFAULT 'training' NOT NULL,
	`scope` text DEFAULT 'personal' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`time_limit` integer,
	`passing_score` real DEFAULT 60,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`password` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`middle_name` text,
	`gender` text,
	`birth_date` text,
	`email` text,
	`photo` text,
	`role` text DEFAULT 'user' NOT NULL,
	`is_banned` integer DEFAULT false,
	`ban_reason` text,
	`created_at` integer NOT NULL,
	`last_seen` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);