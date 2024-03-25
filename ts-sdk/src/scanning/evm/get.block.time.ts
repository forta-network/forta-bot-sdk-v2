// returns the block time in seconds given a chainId, used as a polling interval for new blocks
export type GetBlockTime = (chainId: number) => number;

export function provideGetBlockTime(
  isProd: boolean,
  supportedCacheChainIds: number[] = []
): GetBlockTime {
  return function getBlockTime(chainId: number) {
    // when running in production and this chainId is supported by the json-rpc cache, query the cache every 10 seconds
    if (isProd && supportedCacheChainIds.includes(chainId)) {
      return 10;
    }

    // else when running locally during development
    switch (chainId) {
      case 137: // polygon
        return 3;
      case 56: // bsc
        return 5;
      case 43114: // avalanche
        return 3;
      case 250: // fantom
        return 5;
      case 8453: // base
        return 2;
      default:
        return 12; // eth
    }
  };
}
