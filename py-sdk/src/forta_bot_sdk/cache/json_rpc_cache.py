from typing import Any
from pylru import lrucache
from ..utils import Logger, WithRetry, RetryOptions, now, format_exception
from ..metrics import MetricsHelper
from .get_json_rpc_cache_provider import GetJsonRpcCacheProvider
from .is_cache_healthy import IsCacheHealthy
from .cache import Cache

CHAIN_IGNORE_DURATION_SECONDS = 5*60  # 5 minutes


class JsonRpcCache(Cache):
    def __init__(self,
                 get_json_rpc_cache_provider: GetJsonRpcCacheProvider,
                 json_rpc_cache_retry_options: RetryOptions,
                 is_cache_healthy: IsCacheHealthy,
                 metrics_helper: MetricsHelper,
                 with_retry: WithRetry,
                 logger: Logger):
        self.get_json_rpc_cache_provider = get_json_rpc_cache_provider
        self.json_rpc_cache_retry_options = json_rpc_cache_retry_options
        self.is_cache_healthy = is_cache_healthy
        self.metrics_helper = metrics_helper
        self.with_retry = with_retry
        self.logger = logger
        self.ignored_blocks = lrucache(10_000)
        self.ignored_chains: dict[int, int] = {}

    def ignore_block(self, chain_id: int, block_number: int):
        self.ignored_blocks[f'{chain_id}-{block_number}'] = True

    def is_block_ignored(self, chain_id: int, block_number: int) -> bool:
        return f'{chain_id}-{block_number}' in self.ignored_blocks

    def ignore_chain(self, chain_id: int):
        self.ignored_chains[chain_id] = now() + CHAIN_IGNORE_DURATION_SECONDS

    def is_chain_ignored(self, chain_id: int):
        return chain_id in self.ignored_chains and now() < self.ignored_chains[chain_id]

    async def get_latest_block_number(self, chain_id: int) -> str | None:
        if self.is_chain_ignored(chain_id):
            return None

        try:
            block_number_hex = await self.make_request(chain_id, "eth_blockNumber", [])
            return block_number_hex
        except Exception as e:
            self.logger.debug(
                f'get_latest_block_number:error: {format_exception(e)}')
            return None

    async def get_block_with_transactions(self, chain_id: int, block_number: int) -> dict | None:
        if self.is_chain_ignored(chain_id):
            return None

        try:
            return await self.make_request(chain_id, "eth_getBlockByNumber", [hex(block_number), True])
        except:
            # if the block was not in cache, ignore the block so we dont try to fetch its logs or traces from cache
            self.ignore_block(chain_id, block_number)
            # if last 3 blocks were not in cache, ignore the chain for a while
            if self.is_block_ignored(chain_id, block_number-1) and self.is_block_ignored(chain_id, block_number-2):
                self.ignore_chain(chain_id)
        return None

    async def get_logs_for_block(self, chain_id: int, block_number: int) -> list[dict] | None:
        if self.is_chain_ignored(chain_id):
            return None
        if self.is_block_ignored(chain_id, block_number):
            return None

        try:
            block_number_hex = hex(block_number)
            return await self.make_request(chain_id, "eth_getLogs", [{'fromBlock': block_number_hex, 'toBlock': block_number_hex}])
        except:
            return None

    async def get_trace_data(self, chain_id: int, block_number: int) -> list[dict] | None:
        if self.is_chain_ignored(chain_id):
            return None
        if self.is_block_ignored(chain_id, block_number):
            return None

        try:
            return await self.make_request(chain_id, "trace_block", [hex(block_number)])
        except:
            return None

    async def make_request(self, chain_id: int, method_name: str, args: list[Any]):
        is_cache_healthy = await self.is_cache_healthy(chain_id)
        self.logger.debug(f'isCacheHealthy({chain_id})={is_cache_healthy}')
        if not is_cache_healthy:
            return None

        provider = self.get_json_rpc_cache_provider(chain_id)
        request_id = self.metrics_helper.start_json_rpc_cache_timer(
            chain_id, method_name)
        try:
            # self.logger.debug(
            #     f'making json_rpc_cache request for {method_name} (now={now()})')
            response = await self.with_retry(provider.provider.make_request, method_name, args, retry_options=self.json_rpc_cache_retry_options)
            # self.logger.debug(
            #     f'completed json_rpc_cache request for {method_name} (now={now()})')
            self.metrics_helper.report_json_rpc_cache_success(
                request_id, chain_id, method_name)
            return response['result']
        except Exception as e:
            self.logger.debug(
                f'gave up fetching {method_name} from rpc cache for chain {chain_id}: {e}')
            self.metrics_helper.report_json_rpc_cache_error(
                request_id, chain_id, method_name)
            raise e
