
export interface StatementRow {
  date: string;
  description: string;
  debit: number | null;
  credit: number | null;
  currency: string;
  cardName: string;
  transactionType: string;
  location: string;
}

export interface StandardizedStatement {
  rows: StatementRow[];
  filename: string;
}
