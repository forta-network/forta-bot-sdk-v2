export interface Transaction {
  hash: string;
  from: string;
  to: string | null;
  nonce: number;
  gas: string;
  gasPrice: string;
  value: string;
  data: string;
  r: string;
  s: string;
  v: string;
}

export type JsonRpcTransaction = Omit<Transaction, "nonce" | "data"> & {
  nonce: string;
  input: string;
};
