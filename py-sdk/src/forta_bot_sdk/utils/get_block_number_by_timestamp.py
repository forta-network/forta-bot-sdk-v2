from typing import Callable
from web3 import AsyncWeb3

# returns the nearest block number given a timestamp
GetBlockNumberByTimestamp = Callable[[AsyncWeb3, int], int]


def provide_get_block_number_by_timestamp() -> GetBlockNumberByTimestamp:

    async def get_block_number_by_timestamp(provider: AsyncWeb3, timestamp: int, start_block: int = 0, end_block: int = None) -> int:
        if end_block is None:
            end_block = await provider.eth.block_number

        while start_block <= end_block:
            mid_block = (start_block + end_block) // 2
            block = await provider.eth.get_block(mid_block)

            if block is None:
                break  # Failed to fetch the block

            block_timestamp = block['timestamp']

            if block_timestamp < timestamp:
                start_block = mid_block + 1
            elif block_timestamp > timestamp:
                end_block = mid_block - 1
            else:
                break  # Exact match

        print(
            f"************* Block number closest to timestamp {timestamp}: {mid_block}")

    return get_block_number_by_timestamp
