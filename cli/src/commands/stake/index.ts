import { Wallet, JsonRpcProvider, parseEther, formatEther } from "ethers";
import { assertExists, assertIsNonEmptyString } from "@fortanetwork/forta-bot";
import { CommandHandler } from "../..";
import { GetCredentials } from "../../keys";
import { FortToken, Staking } from "../../contracts";

export const MIN_STAKE = "100"; // 100 FORT
const MIN_STAKE_BIGINT = parseEther(MIN_STAKE);

export function provideStake(
  botId: string,
  getCredentials: GetCredentials,
  fortToken: FortToken,
  staking: Staking,
  stakingAddress: string,
  polygonProvider: JsonRpcProvider
): CommandHandler {
  assertExists(getCredentials, "getCredentials");
  assertExists(fortToken, "fortToken");
  assertExists(staking, "staking");
  assertIsNonEmptyString(stakingAddress, "stakingAddress");

  return async function stake(fromWallet?: Wallet) {
    assertIsNonEmptyString(botId, "botId");
    const { privateKey } = await getCredentials();
    fromWallet = fromWallet ?? new Wallet(privateKey);

    const [activeStake, maticBalance, fortBalance, fortAllowance] =
      await Promise.all([
        staking.activeStakeFor(botId),
        polygonProvider.getBalance(fromWallet.address),
        fortToken.balanceOf(fromWallet),
        fortToken.allowance(fromWallet, stakingAddress),
      ]);

    // check if already staked
    if (activeStake >= MIN_STAKE_BIGINT) {
      console.log(
        `bot ${botId} already has stake of ${formatEther(
          activeStake
        )} FORT (minimum required: ${MIN_STAKE} FORT)`
      );
      return;
    }

    console.log(
      `staking on bot ${botId} from address ${fromWallet.address}...`
    );
    // verify wallet has some balance to pay transaction fee
    if (maticBalance == 0n) {
      throw new Error(
        `${fromWallet.address} has insufficient MATIC balance for transaction fees`
      );
    }

    // verify FORT balance
    if (fortBalance < MIN_STAKE_BIGINT) {
      throw new Error(
        `insufficient FORT balance to stake (need minimum ${MIN_STAKE} FORT, currently have ${formatEther(
          fortBalance
        )} FORT)`
      );
    }

    // approve FORT if allowance below minimum required stake
    if (fortAllowance < MIN_STAKE_BIGINT) {
      console.log(`approving ${MIN_STAKE} FORT for staking...`);
      await fortToken.approve(fromWallet, stakingAddress, MIN_STAKE_BIGINT);
    }

    // deposit stake on bot
    console.log(`staking on bot ${botId}...`);
    await staking.depositStake(fromWallet, botId, MIN_STAKE_BIGINT);
    console.log(`successfully staked ${MIN_STAKE} FORT on bot ${botId}`);
  };
}
