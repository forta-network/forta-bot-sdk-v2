export type GetBotOwner = () => string;

export function provideGetBotOwner(fortaBotOwner: string): GetBotOwner {
  return function getBotOwner() {
    if (fortaBotOwner) return fortaBotOwner;

    return "0xMockOwner";
  };
}
