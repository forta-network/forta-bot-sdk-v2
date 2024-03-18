import {
  Finding,
  FindingSeverity,
  FindingType,
  scanEthereum,
  scanPolygon,
  scanAlerts,
  runHealthCheck,
} from "forta-bot";

export const ERC20_TRANSFER_EVENT =
  "event Transfer(address indexed from, address indexed to, uint256 value)";
export const TETHER_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
export const TETHER_DECIMALS = 6;
let findingsCount = 0;

const handleTransaction = async (txEvent, provider) => {
  const findings = [];

  // limiting this bot to emit only 5 findings so that the alert feed is not spammed
  if (findingsCount >= 5) return findings;

  // filter the transaction logs for Tether transfer events
  const tetherTransferEvents = txEvent.filterLog(
    ERC20_TRANSFER_EVENT,
    TETHER_ADDRESS
  );

  tetherTransferEvents.forEach((transferEvent) => {
    // extract transfer event arguments
    const [to, from, value] = transferEvent.args;
    // shift decimals of transfer value
    const normalizedValue = value / BigInt(10 ** TETHER_DECIMALS);

    // if more than 10,000 Tether were transferred, report it
    if (normalizedValue > 10000) {
      findings.push(
        Finding.fromObject({
          name: "High Tether Transfer",
          description: `High amount of USDT transferred: ${normalizedValue}`,
          alertId: "FORTA-1",
          severity: FindingSeverity.Low,
          type: FindingType.Info,
          metadata: {
            to,
            from,
          },
          source: {
            chains: [{ chainId: txEvent.chainId }],
          },
        })
      );
      findingsCount++;
    }
  });

  return findings;
};

async function main() {
  scanEthereum({
    rpcUrl: "https://cloudflare-eth.com/",
    handleTransaction,
  });

  // scanPolygon({
  //   rpcUrl: "https://polygon-mainnet.g.alchemy.com/v2",
  //   rpcKeyId: "d7f5e66f-0deb-4002-a52d-9b17ad254b38",
  //   localRpcUrl: "137",
  //   handleBlock,
  // });

  // scanAlerts({
  //   subscriptions: [{ botId: "0xbotId123" }],
  //   handleAlert,
  // });

  // health checks are required to run on scan nodes (i.e. not needed for external bots)
  runHealthCheck();
}

main();