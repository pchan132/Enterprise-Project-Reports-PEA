/*
  Warnings:

  - The `request_type` column on the `electrical_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "electrical_requests" DROP COLUMN "request_type",
ADD COLUMN     "request_type" TEXT[];
