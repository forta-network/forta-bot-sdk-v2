import { ethers, Signer, JsonRpcProvider } from "ethers";
import BotRegistryAbi from "./abi/bot.registry.json";
import { getTxOptions } from ".";

const FALLBACK_CREATE_AGENT_GAS_LIMIT = 350_000n;
const FALLBACK_UPDATE_AGENT_GAS_LIMIT = 95_000n;
const FALLBACK_ENABLE_AGENT_GAS_LIMIT = 55_000n;
const FALLBACK_DISABLE_AGENT_GAS_LIMIT = 70_000n;

export type BotDescription = {
  created: boolean;
  owner: string;
  metadata: string;
};

export class BotRegistry {
  constructor(
    private polygonProvider: JsonRpcProvider,
    private botRegistryAddress: string
  ) {}

  async getAgent(agentId: string): Promise<BotDescription> {
    return this.getContract().getAgent(agentId);
  }

  async agentExists(agentId: string) {
    const agent = await this.getAgent(agentId);
    return agent.created;
  }

  async createAgent(
    fromWallet: Signer,
    agentId: string,
    reference: string,
    chainIds: number[]
  ) {
    const from = await fromWallet.getAddress();
    const contract = this.getContract(fromWallet);
    let gas = FALLBACK_CREATE_AGENT_GAS_LIMIT;
    try {
      gas = await contract.createAgent.estimateGas(
        agentId,
        from,
        reference,
        chainIds
      );
    } catch (e) {
      console.log(
        `unable to estimate gas for createAgent, using fallback gas limit (${gas})`
      );
    }
    const txOptions = await getTxOptions(
      gas,
      fromWallet.connect(this.polygonProvider)
    );
    const tx = await contract.createAgent(
      agentId,
      from,
      reference,
      chainIds,
      txOptions
    );
    await tx.wait();
    return tx.hash;
  }

  async updateAgent(
    fromWallet: Signer,
    agentId: string,
    reference: string,
    chainIds: number[]
  ) {
    const contract = this.getContract(fromWallet);
    let gas = FALLBACK_UPDATE_AGENT_GAS_LIMIT;
    try {
      gas = await contract.updateAgent.estimateGas(
        agentId,
        reference,
        chainIds
      );
    } catch (e) {
      console.log(
        `unable to estimate gas for updateAgent, using fallback gas limit (${gas})`
      );
    }
    const txOptions = await getTxOptions(
      gas,
      fromWallet.connect(this.polygonProvider)
    );
    const tx = await contract.updateAgent(
      agentId,
      reference,
      chainIds,
      txOptions
    );
    await tx.wait();
    return tx.hash;
  }

  async isEnabled(agentId: string) {
    return this.getContract().isEnabled(agentId);
  }

  async disableAgent(fromWallet: Signer, agentId: string) {
    const contract = this.getContract(fromWallet);
    let gas = FALLBACK_DISABLE_AGENT_GAS_LIMIT;
    try {
      gas = await contract.disableAgent.estimateGas(
        agentId,
        1
      ); /* Permission.OWNER = 1 */
    } catch (e) {
      console.log(
        `unable to estimate gas for disableAgent, using fallback gas limit (${gas})`
      );
    }
    const txOptions = await getTxOptions(
      gas,
      fromWallet.connect(this.polygonProvider)
    );
    const tx = await contract.disableAgent(agentId, 1, txOptions);
    await tx.wait();
    return tx.hash;
  }

  async enableAgent(fromWallet: Signer, agentId: string) {
    const contract = this.getContract(fromWallet);
    let gas = FALLBACK_ENABLE_AGENT_GAS_LIMIT;
    try {
      gas = await contract.enableAgent.estimateGas(
        agentId,
        1
      ); /* Permission.OWNER = 1 */
    } catch (e) {
      console.log(
        `unable to estimate gas for enableAgent, using fallback gas limit (${gas})`
      );
    }
    const txOptions = await getTxOptions(
      gas,
      fromWallet.connect(this.polygonProvider)
    );
    const tx = await contract.enableAgent(agentId, 1, txOptions);
    await tx.wait();
    return tx.hash;
  }

  private getContract(fromWallet?: Signer) {
    return new ethers.Contract(
      this.botRegistryAddress,
      BotRegistryAbi,
      fromWallet
        ? fromWallet.connect(this.polygonProvider)
        : this.polygonProvider
    );
  }
}
