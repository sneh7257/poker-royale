CREATE TABLE `limits` (
	`key` text PRIMARY KEY NOT NULL,
	`bucket` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`private` integer NOT NULL,
	`status` text NOT NULL,
	`count` integer NOT NULL,
	`capacity` integer NOT NULL,
	`state` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `rooms_lobby` ON `rooms` (`private`,`status`,`updated`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`profile` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);