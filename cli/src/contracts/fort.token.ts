import { Wallet, JsonRpcProvider, Contract } from "ethers";
import FortTokenAbi from "./abi/fort.token.json";
import { getTxOptions } from ".";

const FALLBACK_APPROVE_GAS_LIMIT = 52_000n;

export class FortToken {
  constructor(
    private polygonProvider: JsonRpcProvider,
    private fortTokenAddress: string
  ) {}

  async balanceOf(wallet: Wallet): Promise<bigint> {
    return this.getContract().balanceOf(wallet.address);
  }

  async allowance(wallet: Wallet, spender: string): Promise<bigint> {
    return this.getContract().allowance(wallet.address, spender);
  }

  async approve(fromWallet: Wallet, spender: string, amount: bigint) {
    const contract = this.getContract(fromWallet);
    let gas = FALLBACK_APPROVE_GAS_LIMIT;
    try {
      gas = await contract.approve.estimateGas(spender, amount);
    } catch (e) {
      console.log(
        `unable to estimate gas for approve, using fallback gas limit (${gas})`
      );
    }
    const txOptions = await getTxOptions(
      gas,
      fromWallet.connect(this.polygonProvider)
    );
    const tx = await contract.approve(spender, amount, txOptions);
    await tx.wait();
    return tx.hash;
  }

  private getContract(fromWallet?: Wallet) {
    return new Contract(
      this.fortTokenAddress,
      FortTokenAbi,
      fromWallet
        ? fromWallet.connect(this.polygonProvider)
        : this.polygonProvider
    );
  }
}
