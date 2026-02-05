-- CreateTable
CREATE TABLE "Alarm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "assetId" TEXT,
    "timestamp" DATETIME NOT NULL,
    "severity" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "resolvedAt" DATETIME
);

-- CreateTable
CREATE TABLE "MaintenanceLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "assetId" TEXT,
    "scheduledDate" DATETIME NOT NULL,
    "completedDate" DATETIME,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "technician" TEXT,
    "cost" REAL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "EnergyPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL,
    "region" TEXT NOT NULL,
    "smp" REAL NOT NULL,
    "rec" REAL,
    "priceType" TEXT NOT NULL DEFAULT 'hourly'
);

-- CreateTable
CREATE TABLE "MeterData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "meterId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "activeImport" REAL NOT NULL,
    "activeExport" REAL NOT NULL,
    "reactiveImport" REAL,
    "reactiveExport" REAL,
    "maxDemand" REAL,
    "powerFactor" REAL
);

-- CreateTable
CREATE TABLE "BatteryData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "batteryId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "soc" REAL NOT NULL,
    "soh" REAL,
    "voltage" REAL NOT NULL,
    "current" REAL NOT NULL,
    "power" REAL NOT NULL,
    "temperature" REAL,
    "cycleCount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'idle'
);

-- CreateTable
CREATE TABLE "Revenue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "energySales" REAL NOT NULL,
    "recSales" REAL,
    "smpRevenue" REAL,
    "totalRevenue" REAL NOT NULL,
    "generationKwh" REAL NOT NULL,
    "avgSmpPrice" REAL
);

-- CreateTable
CREATE TABLE "GridData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "gridVoltage" REAL NOT NULL,
    "gridFrequency" REAL NOT NULL,
    "exportPower" REAL NOT NULL,
    "importPower" REAL NOT NULL,
    "powerFactor" REAL,
    "gridStatus" TEXT NOT NULL DEFAULT 'connected'
);

-- CreateTable
CREATE TABLE "ModuleData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "stringId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "voltage" REAL NOT NULL,
    "current" REAL NOT NULL,
    "power" REAL NOT NULL,
    "temperature" REAL,
    "irradiance" REAL,
    "soiling" REAL
);

-- CreateIndex
CREATE INDEX "Alarm_siteId_timestamp_idx" ON "Alarm"("siteId", "timestamp");

-- CreateIndex
CREATE INDEX "Alarm_severity_idx" ON "Alarm"("severity");

-- CreateIndex
CREATE INDEX "Alarm_status_idx" ON "Alarm"("status");

-- CreateIndex
CREATE INDEX "MaintenanceLog_siteId_idx" ON "MaintenanceLog"("siteId");

-- CreateIndex
CREATE INDEX "MaintenanceLog_scheduledDate_idx" ON "MaintenanceLog"("scheduledDate");

-- CreateIndex
CREATE INDEX "MaintenanceLog_status_idx" ON "MaintenanceLog"("status");

-- CreateIndex
CREATE INDEX "EnergyPrice_timestamp_idx" ON "EnergyPrice"("timestamp");

-- CreateIndex
CREATE INDEX "EnergyPrice_region_idx" ON "EnergyPrice"("region");

-- CreateIndex
CREATE UNIQUE INDEX "EnergyPrice_timestamp_region_key" ON "EnergyPrice"("timestamp", "region");

-- CreateIndex
CREATE INDEX "MeterData_siteId_timestamp_idx" ON "MeterData"("siteId", "timestamp");

-- CreateIndex
CREATE INDEX "MeterData_meterId_idx" ON "MeterData"("meterId");

-- CreateIndex
CREATE INDEX "MeterData_timestamp_idx" ON "MeterData"("timestamp");

-- CreateIndex
CREATE INDEX "BatteryData_siteId_timestamp_idx" ON "BatteryData"("siteId", "timestamp");

-- CreateIndex
CREATE INDEX "BatteryData_batteryId_idx" ON "BatteryData"("batteryId");

-- CreateIndex
CREATE INDEX "BatteryData_timestamp_idx" ON "BatteryData"("timestamp");

-- CreateIndex
CREATE INDEX "Revenue_siteId_idx" ON "Revenue"("siteId");

-- CreateIndex
CREATE INDEX "Revenue_date_idx" ON "Revenue"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Revenue_siteId_date_key" ON "Revenue"("siteId", "date");

-- CreateIndex
CREATE INDEX "GridData_siteId_timestamp_idx" ON "GridData"("siteId", "timestamp");

-- CreateIndex
CREATE INDEX "GridData_timestamp_idx" ON "GridData"("timestamp");

-- CreateIndex
CREATE INDEX "ModuleData_siteId_timestamp_idx" ON "ModuleData"("siteId", "timestamp");

-- CreateIndex
CREATE INDEX "ModuleData_stringId_idx" ON "ModuleData"("stringId");

-- CreateIndex
CREATE INDEX "ModuleData_timestamp_idx" ON "ModuleData"("timestamp");
