const {
  FindingType,
  FindingSeverity,
  Finding,
  createTransactionEvent,
} = require("@fortanetwork/forta-bot");
const {
  handleTransaction,
  ERC20_TRANSFER_EVENT,
  TETHER_ADDRESS,
} = require("./bot");

describe("high tether transfer agent", () => {
  describe("handleTransaction", () => {
    const mockTxEvent = createTransactionEvent(
      { hash: "0x1234" },
      {},
      1,
      [],
      []
    );
    mockTxEvent.filterLog = jest.fn();

    beforeEach(() => {
      mockTxEvent.filterLog.mockReset();
    });

    it("returns empty findings if there are no Tether transfers", async () => {
      mockTxEvent.filterLog.mockReturnValue([]);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
      expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterLog).toHaveBeenCalledWith(
        ERC20_TRANSFER_EVENT,
        TETHER_ADDRESS
      );
    });

    it("returns a finding if there is a Tether transfer over 10,000", async () => {
      const mockTetherTransferEvent = {
        args: {
          from: "0xabc",
          to: "0xdef",
          value: BigInt("20000000000"), //20k with 6 decimals
        },
      };
      mockTxEvent.filterLog.mockReturnValue([mockTetherTransferEvent]);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "High Tether Transfer",
          description: `High amount of USDT transferred: 20000`,
          alertId: "FORTA-1",
          severity: FindingSeverity.Low,
          type: FindingType.Info,
          metadata: {
            to: mockTetherTransferEvent.args.to,
            from: mockTetherTransferEvent.args.from,
          },
          source: {
            chains: [{ chainId: mockTxEvent.chainId }],
            transactions: [
              { hash: mockTxEvent.hash, chainId: mockTxEvent.chainId },
            ],
          },
        }),
      ]);
      expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterLog).toHaveBeenCalledWith(
        ERC20_TRANSFER_EVENT,
        TETHER_ADDRESS
      );
    });
  });
});
