import { ethers } from "ethers";
import _ from "lodash";
// import { filterLog } from "..";
import { Log, LogDescription } from "../logs";
import { Trace } from "../traces";
import { Transaction } from "./transaction";
import { provideFilterLogs } from "../logs";

export interface TxEventBlock {
  hash: string;
  number: number;
  timestamp: number;
}

// used for decoded function calls, simply including the address of where the function was called
export type TransactionDescription = ethers.TransactionDescription & {
  address: string;
};

const filterLogs = provideFilterLogs();

export class TransactionEvent {
  constructor(
    readonly chainId: number,
    readonly transaction: Transaction,
    readonly traces: Trace[] = [],
    readonly addresses: { [key: string]: boolean },
    readonly block: TxEventBlock,
    readonly logs: Log[] = [],
    readonly contractAddress: string | null
  ) {}

  get network() {
    return this.chainId;
  }

  get hash() {
    return this.transaction.hash;
  }

  get from() {
    return this.transaction.from;
  }

  get to() {
    return this.transaction.to;
  }

  get gasPrice() {
    return this.transaction.gasPrice;
  }

  get timestamp() {
    return this.block.timestamp;
  }

  get blockNumber() {
    return this.block.number;
  }

  get blockHash() {
    return this.block.hash;
  }

  filterLog(
    eventAbi: string | string[],
    contractAddress?: string | string[]
  ): LogDescription[] {
    return filterLogs(this.logs, eventAbi, contractAddress);
  }

  filterFunction(
    functionAbi: string | string[],
    contractAddress?: string | string[]
  ): TransactionDescription[] {
    functionAbi = _.isArray(functionAbi) ? functionAbi : [functionAbi];
    // determine where to look for function calls (i.e. transaction object or traces)
    let sources: { data: string; value: string; to?: string | null }[] = [
      this.transaction,
    ];
    if (this.traces.length) {
      sources = this.traces.map(({ action }) => ({
        data: action.input,
        value: action.value,
        to: action.to,
      }));
    }
    // filter by contract address, if provided
    if (contractAddress) {
      contractAddress = _.isArray(contractAddress)
        ? contractAddress
        : [contractAddress];
      const contractAddressMap: { [address: string]: boolean } = {};
      contractAddress.forEach((address) => {
        contractAddressMap[address.toLowerCase()] = true;
      });
      sources = sources.filter(
        (source) => source.to && contractAddressMap[source.to.toLowerCase()]
      );
    }
    // parse function inputs
    const results: TransactionDescription[] = [];
    const iface = new ethers.Interface(functionAbi);
    for (const source of sources) {
      const parsedTransaction = iface.parseTransaction(source);
      if (!parsedTransaction) continue;

      results.push(
        Object.assign(parsedTransaction, {
          address: source.to?.toLowerCase()!,
        })
      );
    }
    return results;
  }
}
