export interface DebtNotification {
  userIdToSend: number;
  message: string;
  debtId: number;
  timestamp: string;
  action: string;
}

export enum DebtAction {
  PAID = 'PAID',
  DELETED = 'DELETED'
}
