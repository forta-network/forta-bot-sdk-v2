// returns the scanner-injected chain id to specify which chain should be scanned by this bot
export type GetChainId = () => number | undefined;

export function provideGetChainId(
  fortaChainId: number | undefined
): GetChainId {
  return function getChainId() {
    return fortaChainId;
  };
}
