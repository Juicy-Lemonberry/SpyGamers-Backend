/*
  Warnings:

  - You are about to drop the `AccountTimeZone` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AccountTimeZone" DROP CONSTRAINT "AccountTimeZone_account_id_fkey";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "timezone_code" VARCHAR(1) NOT NULL DEFAULT 'A';

-- DropTable
DROP TABLE "AccountTimeZone";
