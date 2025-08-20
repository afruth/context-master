-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ageYears" INTEGER NOT NULL,
    "ageDays" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "speciality" TEXT,
    "form" INTEGER NOT NULL,
    "stamina" INTEGER NOT NULL,
    "keeper" INTEGER,
    "defending" INTEGER,
    "playmaking" INTEGER,
    "winger" INTEGER,
    "passing" INTEGER,
    "scoring" INTEGER,
    "setPieces" INTEGER,
    "purchaseDate" DATETIME NOT NULL,
    "purchasePrice" INTEGER NOT NULL,
    "fromTeam" TEXT,
    "currentStatus" TEXT NOT NULL DEFAULT 'OWNED',
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SaleTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "saleDate" DATETIME NOT NULL,
    "salePrice" INTEGER NOT NULL,
    "percentageKept" INTEGER NOT NULL,
    "toTeam" TEXT,
    "notes" TEXT,
    "profitLoss" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SaleTransaction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalaryHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "weeklyPay" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalaryHistory_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Player_userId_idx" ON "Player"("userId");

-- CreateIndex
CREATE INDEX "Player_currentStatus_idx" ON "Player"("currentStatus");

-- CreateIndex
CREATE INDEX "Player_purchaseDate_idx" ON "Player"("purchaseDate");

-- CreateIndex
CREATE INDEX "SaleTransaction_playerId_idx" ON "SaleTransaction"("playerId");

-- CreateIndex
CREATE INDEX "SaleTransaction_saleDate_idx" ON "SaleTransaction"("saleDate");

-- CreateIndex
CREATE INDEX "SalaryHistory_playerId_idx" ON "SalaryHistory"("playerId");

-- CreateIndex
CREATE INDEX "SalaryHistory_startDate_idx" ON "SalaryHistory"("startDate");
