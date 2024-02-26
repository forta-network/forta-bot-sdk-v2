from typing import Callable
from .block_event import BlockEvent

CreateBlockEvent = Callable[[dict, int], BlockEvent]

def provide_create_block_event() -> CreateBlockEvent:

  def create_block_event(block: dict, chain_id: int):
    return BlockEvent({'chain_id': chain_id, 'block': block})

  return create_block_event