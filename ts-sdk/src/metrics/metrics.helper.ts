import { MetricName, MetricsManager } from ".";

export class MetricsHelper {
  private readonly timers: { [key: string]: number } = {}; // TODO use lru-cache
  private readonly HANDLE_ALERT_CHAIN_ID = 0; // since handleAlert is not associated to a chain, we assign a special value
  private jsonRpcRequestId: number = 0; // used to generate unique IDs for tracking json rpc requests

  constructor(private readonly metricsManager: MetricsManager) {}

  public reportFindings(chainId: number, value: number) {
    if (value == 0) return;
    this.metricsManager.reportMetric(chainId, MetricName.FINDING_COUNT, value);
  }

  /***********************************
   * HANDLE BLOCK METRICS
   ***********************************/

  public reportHandleBlockRequest(chainId: number) {
    this.metricsManager.reportMetric(
      chainId,
      MetricName.HANDLE_BLOCK_REQUEST_COUNT,
      1
    );
  }

  public startBlockQueryTimer(
    chainId: number,
    blockHashOrNumber: number | string
  ): number {
    const now = Date.now();
    this.timers[`${this.blockKey(chainId, blockHashOrNumber)}-query`] = now;
    return now;
  }

  public endBlockQueryTimer(
    chainId: number,
    blockHashOrNumber: number | string
  ) {
    const timerKey = `${this.blockKey(chainId, blockHashOrNumber)}-query`;
    const startTime = this.timers[timerKey];
    delete this.timers[timerKey];
    this.metricsManager.reportMetric(
      chainId,
      MetricName.HANDLE_BLOCK_EVENT_AGE,
      Date.now() - startTime
    );
  }

  public reportHandleBlockBlockAge(
    chainId: number,
    blockTimestampSeconds: number
  ) {
    this.metricsManager.reportMetric(
      chainId,
      MetricName.HANDLE_BLOCK_BLOCK_AGE,
      Date.now() - blockTimestampSeconds * 1000
    );
  }

  public startHandleBlockTimer(
    chainId: number,
    blockHashOrNumber: number | string,
    blockTimestampSeconds: number
  ) {
    // report block event age
    this.endBlockQueryTimer(chainId, blockHashOrNumber);
    // report block age
    this.reportHandleBlockBlockAge(chainId, blockTimestampSeconds);
    // report handleBlock invocation
    this.reportHandleBlockRequest(chainId);
    // record the handleBlock start time
    this.timers[this.blockKey(chainId, blockHashOrNumber)] = Date.now();
  }

  public endHandleBlockTimer(
    chainId: number,
    blockHashOrNumber: number | string
  ) {
    // fetch the recorded start time for handleBlock
    const blockKey = this.blockKey(chainId, blockHashOrNumber);
    const startTime = this.timers[blockKey];
    delete this.timers[blockKey]; // remove from memory
    // report handleBlock latency
    this.metricsManager.reportMetric(
      chainId,
      MetricName.HANDLE_BLOCK_LATENCY,
      Date.now() - startTime
    );
  }

  public reportHandleBlockSuccess(chainId: number, findingsCount: number) {
    // report number of findings from handleBlock
    this.reportFindings(chainId, findingsCount);
    // report handleBlock success
    this.metricsManager.reportMetric(
      chainId,
      MetricName.HANDLE_BLOCK_SUCCESS_COUNT,
      1
    );
  }

  public reportHandleBlockError(chainId: number) {
    this.metricsManager.reportMetric(
      chainId,
      MetricName.HANDLE_BLOCK_ERROR_COUNT,
      1
    );
  }

  private blockKey(
    chainId: number,
    blockHashOrNumber: number | string
  ): string {
    return `${chainId}-${blockHashOrNumber}`;
  }

  /***********************************
   * HANDLE TRANSACTION METRICS
   ***********************************/

  public reportHandleTransactionRequest(chainId: number) {
    this.metricsManager.reportMetric(
      chainId,
      MetricName.HANDLE_TX_REQUEST_COUNT,
      1
    );
  }

  public reportHandleTransactionSuccess(
    chainId: number,
    findingsCount: number
  ) {
    this.reportFindings(chainId, findingsCount);
    this.metricsManager.reportMetric(
      chainId,
      MetricName.HANDLE_TX_SUCCESS_COUNT,
      1
    );
  }

  public reportHandleTransactionBlockEventAge(
    chainId: number,
    blockQueryStartTime: number
  ) {
    this.metricsManager.reportMetric(
      chainId,
      MetricName.HANDLE_TX_EVENT_AGE,
      Date.now() - blockQueryStartTime
    );
  }

  public reportHandleTransactionBlockAge(
    chainId: number,
    blockTimestampSeconds: number
  ) {
    this.metricsManager.reportMetric(
      chainId,
      MetricName.HANDLE_TX_BLOCK_AGE,
      Date.now() - blockTimestampSeconds * 1000
    );
  }

  public startHandleTransactionTimer(
    chainId: number,
    txHash: string,
    blockQueryStartTime: number,
    blockTimestampSeconds: number
  ) {
    this.reportHandleTransactionBlockEventAge(chainId, blockQueryStartTime);
    this.reportHandleTransactionBlockAge(chainId, blockTimestampSeconds);
    this.reportHandleTransactionRequest(chainId);
    this.timers[this.txKey(chainId, txHash)] = Date.now();
  }

  public endHandleTransactionTimer(chainId: number, txHash: string) {
    const txKey = this.txKey(chainId, txHash);
    const startTime = this.timers[txKey];
    delete this.timers[txKey];
    this.metricsManager.reportMetric(
      chainId,
      MetricName.HANDLE_TX_LATENCY,
      Date.now() - startTime
    );
  }

  public reportHandleTransactionError(chainId: number) {
    this.metricsManager.reportMetric(
      chainId,
      MetricName.HANDLE_TX_ERROR_COUNT,
      1
    );
  }

  private txKey(chainId: number, txHash: string) {
    return `${chainId}-${txHash}`;
  }

  /***********************************
   * HANDLE ALERT METRICS
   ***********************************/

  public reportHandleAlertRequest() {
    this.metricsManager.reportMetric(
      this.HANDLE_ALERT_CHAIN_ID,
      MetricName.HANDLE_ALERT_REQUEST_COUNT,
      1
    );
  }

  public reportHandleAlertSuccess(findingsCount: number) {
    this.reportFindings(this.HANDLE_ALERT_CHAIN_ID, findingsCount);
    this.metricsManager.reportMetric(
      this.HANDLE_ALERT_CHAIN_ID,
      MetricName.HANDLE_ALERT_SUCCESS_COUNT,
      1
    );
  }

  public reportHandleAlertError() {
    this.metricsManager.reportMetric(
      this.HANDLE_ALERT_CHAIN_ID,
      MetricName.HANDLE_ALERT_ERROR_COUNT,
      1
    );
  }

  public startHandleAlertTimer(alertHash: string) {
    this.reportHandleAlertRequest();
    this.timers[alertHash] = Date.now();
  }

  public endHandleAlertTimer(alertHash: string) {
    const startTime = this.timers[alertHash];
    delete this.timers[alertHash];
    this.metricsManager.reportMetric(
      this.HANDLE_ALERT_CHAIN_ID,
      MetricName.HANDLE_ALERT_LATENCY,
      Date.now() - startTime
    );
  }

  /***********************************
   * JSON RPC METRICS
   ***********************************/

  public startJsonRpcTimer(chainId: number, methodName: string): number {
    this.reportJsonRpcRequest(chainId, methodName);
    this.jsonRpcRequestId++;
    this.timers[`rpc-${this.jsonRpcRequestId}`] = Date.now();
    return this.jsonRpcRequestId;
  }

  public endJsonRpcTimer(
    requestId: number,
    chainId: number,
    methodName: string
  ) {
    const requestKey = `rpc-${requestId}`;
    const startTime = this.timers[requestKey];
    delete this.timers[requestKey];
    this.metricsManager.reportMetric(
      chainId,
      `${MetricName.JSON_RPC_LATENCY}.${methodName}`,
      Date.now() - startTime
    );
  }

  public reportJsonRpcRequest(chainId: number, methodName: string) {
    this.metricsManager.reportMetric(
      chainId,
      `${MetricName.JSON_RPC_REQUEST_COUNT}.${methodName}`,
      1
    );
  }

  public reportJsonRpcSuccess(
    requestId: number,
    chainId: number,
    methodName: string
  ) {
    this.metricsManager.reportMetric(
      chainId,
      `${MetricName.JSON_RPC_SUCCESS_COUNT}.${methodName}`,
      1
    );
    this.endJsonRpcTimer(requestId, chainId, methodName);
  }

  public reportJsonRpcError(
    requestId: number,
    chainId: number,
    methodName: string
  ) {
    this.metricsManager.reportMetric(
      chainId,
      `${MetricName.JSON_RPC_ERROR_COUNT}.${methodName}`,
      1
    );
    this.endJsonRpcTimer(requestId, chainId, methodName);
  }

  public reportJsonRpcThrottled(
    requestId: number,
    chainId: number,
    methodName: string
  ) {
    this.metricsManager.reportMetric(
      chainId,
      `${MetricName.JSON_RPC_THROTTLED_COUNT}.${methodName}`,
      1
    );
    this.endJsonRpcTimer(requestId, chainId, methodName);
  }

  /***********************************
   * JSON RPC CACHE METRICS
   ***********************************/

  public startJsonRpcCacheTimer(chainId: number, methodName: string): number {
    this.reportJsonRpcCacheRequest(chainId, methodName);
    this.jsonRpcRequestId++;
    this.timers[`rpc-cache-${this.jsonRpcRequestId}`] = Date.now();
    return this.jsonRpcRequestId;
  }

  public endJsonRpcCacheTimer(
    requestId: number,
    chainId: number,
    methodName: string
  ) {
    const requestKey = `rpc-cache-${requestId}`;
    const startTime = this.timers[requestKey];
    delete this.timers[requestKey];
    this.metricsManager.reportMetric(
      chainId,
      `${MetricName.JSON_RPC_CACHE_LATENCY}.${methodName}`,
      Date.now() - startTime
    );
  }

  public reportJsonRpcCacheRequest(chainId: number, methodName: string) {
    this.metricsManager.reportMetric(
      chainId,
      `${MetricName.JSON_RPC_CACHE_REQUEST_COUNT}.${methodName}`,
      1
    );
  }

  public reportJsonRpcCacheSuccess(
    requestId: number,
    chainId: number,
    methodName: string
  ) {
    this.metricsManager.reportMetric(
      chainId,
      `${MetricName.JSON_RPC_CACHE_SUCCESS_COUNT}.${methodName}`,
      1
    );
    this.endJsonRpcCacheTimer(requestId, chainId, methodName);
  }

  public reportJsonRpcCacheError(
    requestId: number,
    chainId: number,
    methodName: string
  ) {
    this.metricsManager.reportMetric(
      chainId,
      `${MetricName.JSON_RPC_CACHE_ERROR_COUNT}.${methodName}`,
      1
    );
    this.endJsonRpcCacheTimer(requestId, chainId, methodName);
  }
}
