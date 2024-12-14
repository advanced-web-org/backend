export default interface CreateDebtDto {
  creditor_id: number;
  debtor_id: number;
  debt_amount: number;
  debt_message: string;
}