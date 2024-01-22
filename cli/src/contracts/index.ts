import { Signer } from "ethers";
import { BotRegistry } from "./bot.registry";
import { FortToken } from "./fort.token";
import { Staking } from "./staking";

export async function getTxOptions(gasLimit: bigint, fromWallet: Signer) {
  const GAS_MULTIPLIER = 1.15;
  const GAS_PRICE_MULTIPLIER = 1.5;
  const gasPrice = (await fromWallet.provider!.getFeeData()).gasPrice!;

  return {
    gasLimit: Math.floor(Number(gasLimit) * GAS_MULTIPLIER),
    gasPrice: Math.floor(Number(gasPrice) * GAS_PRICE_MULTIPLIER),
  };
}

export { BotRegistry, FortToken, Staking };
