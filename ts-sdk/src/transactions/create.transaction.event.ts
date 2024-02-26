import { getCreateAddress } from "ethers";
import { JsonRpcBlock } from "../blocks";
import { formatAddress, isZeroAddress } from "../utils";
import { JsonRpcLog } from "../logs";
import { Trace } from "../traces";
import { JsonRpcTransaction } from "./transaction";
import { TransactionEvent } from "./transaction.event";

// creates a Forta TransactionEvent from a json-rpc transaction receipt and block object
export type CreateTransactionEvent = (
  transaction: JsonRpcTransaction,
  block: JsonRpcBlock,
  chainId: number,
  traces: Trace[],
  logs: JsonRpcLog[]
) => TransactionEvent;

export function provideCreateTransactionEvent(): CreateTransactionEvent {
  return function createTransactionEvent(
    transaction: JsonRpcTransaction,
    block: JsonRpcBlock,
    chainId: number,
    traces: Trace[] = [],
    logs: JsonRpcLog[] = []
  ) {
    const tx = {
      hash: transaction.hash,
      from: formatAddress(transaction.from),
      to: transaction.to ? formatAddress(transaction.to) : null,
      nonce: parseInt(transaction.nonce),
      gas: transaction.gas,
      gasPrice: transaction.gasPrice,
      value: transaction.value,
      data: transaction.input,
      r: transaction.r,
      s: transaction.s,
      v: transaction.v,
    };
    const addresses = {
      [tx.from]: true,
    };
    if (tx.to) {
      addresses[tx.to] = true;
    }

    const blok = {
      hash: block.hash,
      number: parseInt(block.number),
      timestamp: parseInt(block.timestamp),
    };

    const trcs: Trace[] = [];
    traces.forEach((trace) => {
      addresses[formatAddress(trace.action.address)] = true;
      addresses[formatAddress(trace.action.refundAddress)] = true;
      addresses[formatAddress(trace.action.to)] = true;
      addresses[formatAddress(trace.action.from)] = true;

      trcs.push({
        action: {
          callType: trace.action.callType,
          to: formatAddress(trace.action.to),
          input: trace.action.input,
          from: formatAddress(trace.action.from),
          value: trace.action.value,
          init: trace.action.init,
          address: formatAddress(trace.action.address),
          balance: trace.action.balance,
          refundAddress: formatAddress(trace.action.refundAddress),
        },
        blockHash: trace.blockHash,
        blockNumber: trace.blockNumber,
        result: {
          gasUsed: trace.result?.gasUsed,
          address: trace.result?.address,
          code: trace.result?.code,
          output: trace.result?.output,
        },
        subtraces: trace.subtraces,
        traceAddress: trace.traceAddress,
        transactionHash: trace.transactionHash,
        transactionPosition: trace.transactionPosition,
        type: trace.type,
        error: trace.error,
      });
    });

    const lgs = logs.map((log) => ({
      address: formatAddress(log.address),
      topics: log.topics,
      data: log.data,
      logIndex: parseInt(log.logIndex),
      blockNumber: parseInt(log.blockNumber),
      blockHash: log.blockHash,
      transactionIndex: parseInt(log.transactionIndex),
      transactionHash: log.transactionHash,
      removed: log.removed,
    }));
    lgs.forEach((log) => (addresses[log.address] = true));

    let contractAddress = null;
    if (isZeroAddress(transaction.to)) {
      contractAddress = formatAddress(
        getCreateAddress({ from: transaction.from, nonce: transaction.nonce })
      );
    }

    return new TransactionEvent(
      chainId,
      tx,
      trcs,
      addresses,
      blok,
      lgs,
      contractAddress
    );
  };
}
