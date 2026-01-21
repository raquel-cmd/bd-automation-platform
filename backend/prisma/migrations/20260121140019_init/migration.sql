-- CreateTable
CREATE TABLE "platform_metrics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "platform_key" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "weekly_revenue" REAL NOT NULL,
    "mtd_revenue" REAL NOT NULL,
    "mtd_gmv" REAL NOT NULL,
    "target_gmv" REAL NOT NULL,
    "total_contract_revenue" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "flat_fee_contracts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partner_name" TEXT NOT NULL,
    "contract_start" TEXT NOT NULL,
    "contract_end" TEXT NOT NULL,
    "total_contract_revenue" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "flat_fee_allocations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contract_id" INTEGER NOT NULL,
    "partner_name" TEXT NOT NULL,
    "week_start" TEXT NOT NULL,
    "week_end" TEXT NOT NULL,
    "weekly_revenue" REAL NOT NULL,
    "platform_key" TEXT NOT NULL DEFAULT 'flat-fee',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "flat_fee_allocations_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "flat_fee_contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_metrics_platform_key_date_brand_key" ON "platform_metrics"("platform_key", "date", "brand");

-- CreateIndex
CREATE UNIQUE INDEX "flat_fee_allocations_partner_name_week_start_week_end_key" ON "flat_fee_allocations"("partner_name", "week_start", "week_end");
