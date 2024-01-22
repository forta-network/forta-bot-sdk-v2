type FindingSourceChain = {
  chainId: number;
};

type FindingSourceBlock = {
  chainId: number;
  hash: string;
  number: number;
};

type FindingSourceTransaction = {
  chainId: number;
  hash: string;
};

type FindingSourceUrl = {
  url: string;
};

type FindingSourceAlert = {
  id: string;
};

type FindingSourceCustom = {
  name: string;
  value: string;
};

export type FindingSource = {
  chains?: FindingSourceChain[];
  blocks?: FindingSourceBlock[];
  transactions?: FindingSourceTransaction[];
  urls?: FindingSourceUrl[];
  alerts?: FindingSourceAlert[];
  customSources?: FindingSourceCustom[];
};
