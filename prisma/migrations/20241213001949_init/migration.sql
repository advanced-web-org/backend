-- CreateEnum
CREATE TYPE "encrypt_method" AS ENUM ('RSA', 'PGP');

-- CreateEnum
CREATE TYPE "staff_role" AS ENUM ('admin', 'employee');

-- CreateEnum
CREATE TYPE "trans_type" AS ENUM ('transaction', 'deposit');

-- CreateTable
CREATE TABLE "customers" (
    "customer_id" SERIAL NOT NULL,
    "full_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "refresh_token" TEXT,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "account_id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_balance" DECIMAL(15,2) DEFAULT 0.00,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "banks" (
    "bank_id" SERIAL NOT NULL,
    "bank_name" TEXT,
    "public_key" TEXT,
    "encrypt_method" "encrypt_method",

    CONSTRAINT "banks_pkey" PRIMARY KEY ("bank_id")
);

-- CreateTable
CREATE TABLE "beneficiaries" (
    "beneficiary_id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "bank_id" INTEGER NOT NULL,
    "account_number" TEXT NOT NULL,
    "nickname" TEXT,

    CONSTRAINT "beneficiaries_pkey" PRIMARY KEY ("customer_id","bank_id","account_number")
);

-- CreateTable
CREATE TABLE "staffs" (
    "staff_id" SERIAL NOT NULL,
    "full_name" TEXT,
    "role" "staff_role",
    "username" TEXT,
    "password" TEXT,

    CONSTRAINT "staffs_pkey" PRIMARY KEY ("staff_id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "transaction_id" SERIAL NOT NULL,
    "from_bank_id" INTEGER,
    "from_account_number" TEXT,
    "to_bank_id" INTEGER,
    "to_account_number" TEXT,
    "transaction_type" "trans_type",
    "transaction_amount" DECIMAL(15,2) NOT NULL,
    "transaction_message" TEXT,
    "transaction_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "fee_payer" TEXT,
    "fee_amount" DECIMAL(15,2) DEFAULT 0.00,
    "e_signal" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "deposits" (
    "deposit_id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "transaction_id" INTEGER NOT NULL,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("employee_id","transaction_id")
);

-- CreateTable
CREATE TABLE "debts" (
    "debt_id" SERIAL NOT NULL,
    "creditor_id" INTEGER NOT NULL,
    "debtor_id" INTEGER NOT NULL,
    "debt_amount" DECIMAL(15,2) NOT NULL,
    "debt_message" TEXT,
    "status" TEXT,

    CONSTRAINT "debts_pkey" PRIMARY KEY ("debt_id")
);

-- CreateTable
CREATE TABLE "debt_deletions" (
    "deletion_id" SERIAL NOT NULL,
    "debt_id" INTEGER NOT NULL,
    "deleter_id" INTEGER NOT NULL,
    "delete_message" TEXT,

    CONSTRAINT "debt_deletions_pkey" PRIMARY KEY ("debt_id")
);

-- CreateTable
CREATE TABLE "debt_payments" (
    "payment_id" SERIAL NOT NULL,
    "debt_id" INTEGER NOT NULL,
    "transaction_id" INTEGER NOT NULL,

    CONSTRAINT "debt_payments_pkey" PRIMARY KEY ("debt_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_account_number_key" ON "accounts"("account_number");

-- CreateIndex
CREATE UNIQUE INDEX "staffs_username_key" ON "staffs"("username");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("bank_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_from_bank_id_fkey" FOREIGN KEY ("from_bank_id") REFERENCES "banks"("bank_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_bank_id_fkey" FOREIGN KEY ("to_bank_id") REFERENCES "banks"("bank_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "staffs"("staff_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("transaction_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_creditor_id_fkey" FOREIGN KEY ("creditor_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debts" ADD CONSTRAINT "debts_debtor_id_fkey" FOREIGN KEY ("debtor_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_deletions" ADD CONSTRAINT "debt_deletions_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("debt_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_deletions" ADD CONSTRAINT "debt_deletions_deleter_id_fkey" FOREIGN KEY ("deleter_id") REFERENCES "customers"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debt_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("debt_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("transaction_id") ON DELETE RESTRICT ON UPDATE CASCADE;
