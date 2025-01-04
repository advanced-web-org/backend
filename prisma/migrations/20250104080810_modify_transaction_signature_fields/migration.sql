/*
  Warnings:

  - You are about to drop the column `e_signal` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "e_signal",
ADD COLUMN     "request_signature" TEXT,
ADD COLUMN     "response_signature" TEXT;
