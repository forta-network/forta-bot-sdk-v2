// returns the block time in seconds given a chainId
export type GetBlockTime = (chainId: number) => number;

export function provideGetBlockTime(): GetBlockTime {
  return function getBlockTime(chainId: number) {
    switch (chainId) {
      case 1: // eth
        return 12;
      case 56: // bsc
        return 3;
      default:
        return 2;
    }
  };
}
