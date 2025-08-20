-- AlterTable
ALTER TABLE "Player" ADD COLUMN "estimatedSaleValue" INTEGER;

-- CreateIndex
CREATE INDEX "Player_position_idx" ON "Player"("position");

-- CreateIndex
CREATE INDEX "Player_ageYears_idx" ON "Player"("ageYears");

-- CreateIndex
CREATE INDEX "Player_purchasePrice_idx" ON "Player"("purchasePrice");

-- CreateIndex
CREATE INDEX "Player_name_idx" ON "Player"("name");

-- CreateIndex
CREATE INDEX "Player_nationality_idx" ON "Player"("nationality");

-- CreateIndex
CREATE INDEX "SaleTransaction_profitLoss_idx" ON "SaleTransaction"("profitLoss");

-- CreateIndex
CREATE INDEX "SaleTransaction_salePrice_idx" ON "SaleTransaction"("salePrice");
