CREATE TABLE `stock_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`symbol` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`payload` text NOT NULL
);
