// returns the scanner-injected chain id to specify which chain should be scanned by this bot
export type GetFortaChainId = () => number | undefined;

export function provideGetFortaChainId(
  fortaChainId: number | undefined
): GetFortaChainId {
  return function getFortaChainId() {
    return fortaChainId;
  };
}
