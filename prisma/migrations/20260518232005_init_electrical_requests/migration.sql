-- CreateTable
CREATE TABLE "electrical_requests" (
    "id" TEXT NOT NULL,
    "request_no" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phone_2" TEXT,
    "address" TEXT NOT NULL,
    "sub_district" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'ลพบุรี',
    "lat" DECIMAL(10,7),
    "long" DECIMAL(10,7),
    "description" TEXT,
    "request_date" DATE NOT NULL,
    "request_type" TEXT NOT NULL,
    "meter_option" TEXT,
    "ca_ref_no" TEXT,
    "pea_no" TEXT,
    "status" TEXT NOT NULL DEFAULT 'รับเรื่อง',
    "is_follow_up" BOOLEAN NOT NULL DEFAULT false,
    "target_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "electrical_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "electrical_requests_request_no_key" ON "electrical_requests"("request_no");

-- CreateIndex
CREATE INDEX "electrical_requests_request_date_idx" ON "electrical_requests"("request_date");

-- CreateIndex
CREATE INDEX "electrical_requests_status_idx" ON "electrical_requests"("status");
