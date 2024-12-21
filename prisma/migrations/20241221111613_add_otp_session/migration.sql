-- CreateTable
CREATE TABLE "otp_sessions" (
    "user_id" INTEGER NOT NULL,
    "hashed_otp" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "otp_sessions_pkey" PRIMARY KEY ("user_id")
);
