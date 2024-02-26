import { ethers } from "ethers";
import _ from "lodash";
import { Log, LogDescription } from "./log";

export type FilterLogs = (
  logs: Log[],
  eventAbi: string | string[],
  contractAddress?: string | string[]
) => LogDescription[];

export function provideFilterLogs(): FilterLogs {
  return function filterLogs(
    logs: Log[],
    eventAbi: string | string[],
    contractAddress?: string | string[]
  ) {
    eventAbi = _.isArray(eventAbi) ? eventAbi : [eventAbi];
    // filter logs by contract address, if provided
    if (contractAddress) {
      contractAddress = _.isArray(contractAddress)
        ? contractAddress
        : [contractAddress];
      const contractAddressMap: { [address: string]: boolean } = {};
      contractAddress.forEach((address) => {
        contractAddressMap[address.toLowerCase()] = true;
      });
      logs = logs.filter(
        (log) => contractAddressMap[log.address.toLowerCase()]
      );
    }
    // parse logs
    const results: LogDescription[] = [];
    const iface = new ethers.Interface(eventAbi);
    for (const log of logs) {
      try {
        const parsedLog = iface.parseLog(log);
        if (!parsedLog) continue;
        results.push(
          Object.assign(parsedLog, {
            address: log.address,
            logIndex: log.logIndex,
          })
        );
      } catch (e) {} // TODO see if theres a better way to handle 'no matching event' error
    }
    return results;
  };
}
