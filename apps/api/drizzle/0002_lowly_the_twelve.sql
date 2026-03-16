ALTER TABLE "transactions" ADD COLUMN "plaidTransactionId" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "plaidItemId" bigint;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "plaidAccountId" bigint;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "rawMerchantName" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "authorizedDate" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "isoCurrencyCode" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "pending" boolean;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "removedAt" timestamp;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_plaidItemId_plaid_items_id_fk" FOREIGN KEY ("plaidItemId") REFERENCES "public"."plaid_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_plaidAccountId_plaid_accounts_id_fk" FOREIGN KEY ("plaidAccountId") REFERENCES "public"."plaid_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_plaidItemId_idx" ON "transactions" USING btree ("plaidItemId");--> statement-breakpoint
CREATE INDEX "transactions_plaidAccountId_idx" ON "transactions" USING btree ("plaidAccountId");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_plaidTransactionId_key" ON "transactions" USING btree ("plaidTransactionId");