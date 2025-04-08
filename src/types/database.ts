export interface Account {
  id: string;
  item: number;
  responsavel: string;
  status: string;
  name: string;
  cpf: string;
  birth_date: string;
  address: string | null;
  phone: string | null;
  email1: string | null;
  password1: string | null;
  chip: string | null;
  verification: string | null;
  user_id: string; // Certifique-se de que isso esteja definido
  created_at: string;
  updated_at: string;
}

export interface BettingHouse {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AccountBettingHouse {
  id: string;
  account_id: string;
  betting_house_id: string;
  status: string | null;
  verification: string | null;
  saldo: string | null;
  deposito: string | null;
  sacado: string | null;
  creditos: string | null;
  obs: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bank {
  id: string;
  name: string;
  initial_capital: number;
  roi: number;
  gross_profit: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface BettingOperation {
  id: string;
  date: string;
  time: string;
  game_name: string;
  house1_id: string;
  house2_id: string;
  bet_amount: number;
  result: number;
  profit: number;
  promotion_type: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OperationAccount {
  id: string;
  operation_id: string;
  account_id: string;
  betting_house_id: string;
  stake: number;
  role: string;
  is_winner: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonthlySummary {
  id: string;
  year: number;
  month: number;
  total_bets: number;
  total_bet_amount: number;
  total_result: number;
  total_profit: number;
  roi: number;
  accounts_used: number;
  profit_per_account: number;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: Account;
        Insert: Omit<Account, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at'>>;
      };
      betting_houses: {
        Row: BettingHouse;
        Insert: Omit<BettingHouse, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BettingHouse, 'id' | 'created_at' | 'updated_at'>>;
      };
      account_betting_houses: {
        Row: AccountBettingHouse;
        Insert: Omit<AccountBettingHouse, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AccountBettingHouse, 'id' | 'created_at' | 'updated_at'>>;
      };
      banks: {
        Row: Bank;
        Insert: Omit<Bank, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Bank, 'id' | 'created_at' | 'updated_at'>>;
      };
      betting_operations: {
        Row: BettingOperation;
        Insert: Omit<BettingOperation, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<BettingOperation, 'id' | 'created_at' | 'updated_at'>>;
      };
      operation_accounts: {
        Row: OperationAccount;
        Insert: Omit<OperationAccount, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<OperationAccount, 'id' | 'created_at' | 'updated_at'>>;
      };
      monthly_summaries: {
        Row: MonthlySummary;
        Insert: Omit<MonthlySummary, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<MonthlySummary, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}