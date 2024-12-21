-- CreateTable
CREATE TABLE "payment_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "debt_id" INTEGER NOT NULL,
    "hashed_otp" TEXT,
    "otp_expires_at" TIMESTAMP(3),

    CONSTRAINT "payment_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_sessions_user_id_debt_id_key" ON "payment_sessions"("user_id", "debt_id");

-- AddForeignKey
ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("debt_id") ON DELETE RESTRICT ON UPDATE CASCADE;
