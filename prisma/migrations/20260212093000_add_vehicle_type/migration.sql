-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('CAR', 'MOTORCYCLE', 'SCOOTER');

-- AlterTable
ALTER TABLE "Vehicle"
ADD COLUMN "vehicleType" "VehicleType" NOT NULL DEFAULT 'CAR';
