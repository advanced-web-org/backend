/*
  Warnings:

  - The `status` column on the `debts` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "debt_status" AS ENUM ('paid', 'unpaid', 'deleted');

-- AlterTable
ALTER TABLE "debts" DROP COLUMN "status",
ADD COLUMN     "status" "debt_status" NOT NULL DEFAULT 'unpaid';
