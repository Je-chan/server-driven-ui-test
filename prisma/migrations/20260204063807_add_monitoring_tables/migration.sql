-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "capacity" REAL NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'inverter',
    "manufacturer" TEXT,
    "model" TEXT,
    "ratedCapacity" REAL NOT NULL,
    "installDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    CONSTRAINT "Asset_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InverterData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "activePower" REAL NOT NULL,
    "reactivePower" REAL NOT NULL,
    "voltage" REAL,
    "current" REAL,
    "frequency" REAL,
    "dailyEnergy" REAL NOT NULL,
    "totalEnergy" REAL NOT NULL,
    "efficiency" REAL,
    "temperature" REAL,
    CONSTRAINT "InverterData_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeatherData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "irradiance" REAL NOT NULL,
    "temperature" REAL NOT NULL,
    "humidity" REAL,
    "windSpeed" REAL,
    "windDirection" REAL,
    "rainfall" REAL,
    "cloudCover" REAL,
    CONSTRAINT "WeatherData_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KpiDaily" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "dailyGeneration" REAL NOT NULL,
    "expectedGeneration" REAL,
    "pr" REAL,
    "availability" REAL,
    "capacityFactor" REAL,
    "peakPower" REAL,
    "operatingHours" REAL
);

-- CreateIndex
CREATE INDEX "Asset_siteId_idx" ON "Asset"("siteId");

-- CreateIndex
CREATE INDEX "InverterData_assetId_timestamp_idx" ON "InverterData"("assetId", "timestamp");

-- CreateIndex
CREATE INDEX "InverterData_timestamp_idx" ON "InverterData"("timestamp");

-- CreateIndex
CREATE INDEX "WeatherData_siteId_timestamp_idx" ON "WeatherData"("siteId", "timestamp");

-- CreateIndex
CREATE INDEX "WeatherData_timestamp_idx" ON "WeatherData"("timestamp");

-- CreateIndex
CREATE INDEX "KpiDaily_siteId_idx" ON "KpiDaily"("siteId");

-- CreateIndex
CREATE INDEX "KpiDaily_date_idx" ON "KpiDaily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "KpiDaily_siteId_date_key" ON "KpiDaily"("siteId", "date");
