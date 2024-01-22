import { Wallet, JsonRpcProvider, Contract } from "ethers";
import StakingContractAbi from "./abi/staking.json";
import { getTxOptions } from ".";

const BOT_SUBJECT_TYPE = 1;
const FALLBACK_DEPOSIT_GAS_LIMIT = 255_000n;

export class Staking {
  constructor(
    private polygonProvider: JsonRpcProvider,
    private stakingAddress: string
  ) {}

  async activeStakeFor(agentId: string) {
    return this.getContract().activeStakeFor(BOT_SUBJECT_TYPE, agentId);
  }

  async depositStake(fromWallet: Wallet, agentId: string, amount: bigint) {
    const contract = this.getContract(fromWallet);
    let gas = FALLBACK_DEPOSIT_GAS_LIMIT;
    try {
      gas = await contract.deposit.estimateGas(
        BOT_SUBJECT_TYPE,
        agentId,
        amount
      );
    } catch (e) {
      console.log(
        `unable to estimate gas for deposit, using fallback gas limit (${gas})`
      );
    }
    const txOptions = await getTxOptions(
      gas,
      fromWallet.connect(this.polygonProvider)
    );
    const tx = await contract.deposit(
      BOT_SUBJECT_TYPE,
      agentId,
      amount,
      txOptions
    );
    await tx.wait();
    return tx.hash;
  }

  private getContract(fromWallet?: Wallet) {
    return new Contract(
      this.stakingAddress,
      StakingContractAbi,
      fromWallet
        ? fromWallet.connect(this.polygonProvider)
        : this.polygonProvider
    );
  }
}
