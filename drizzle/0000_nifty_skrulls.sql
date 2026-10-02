CREATE TABLE `reflections` (
	`user_id` text NOT NULL,
	`symbol` text NOT NULL,
	`week` text NOT NULL,
	`note` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`user_id`, `symbol`, `week`)
);
