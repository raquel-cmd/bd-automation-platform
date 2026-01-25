-- CreateTable
CREATE TABLE "vacation_plans" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "travelers" INTEGER NOT NULL DEFAULT 1,
    "traveler_names" TEXT,
    "total_budget" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'planning',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "destinations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vacation_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "arrival_date" TEXT,
    "departure_date" TEXT,
    "accommodation" TEXT,
    "accommodation_address" TEXT,
    "accommodation_cost" REAL,
    "transport_mode" TEXT,
    "transport_cost" REAL,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "destinations_vacation_id_fkey" FOREIGN KEY ("vacation_id") REFERENCES "vacation_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vacation_id" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "estimated_cost" REAL NOT NULL DEFAULT 0,
    "actual_cost" REAL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_date" TEXT,
    "vendor" TEXT,
    "confirmation_num" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "expenses_vacation_id_fkey" FOREIGN KEY ("vacation_id") REFERENCES "vacation_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activities" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vacation_id" INTEGER NOT NULL,
    "destination_id" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" TEXT,
    "start_time" TEXT,
    "end_time" TEXT,
    "location" TEXT,
    "estimated_cost" REAL,
    "actual_cost" REAL,
    "is_booked" BOOLEAN NOT NULL DEFAULT false,
    "booking_ref" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "activities_vacation_id_fkey" FOREIGN KEY ("vacation_id") REFERENCES "vacation_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "activities_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
