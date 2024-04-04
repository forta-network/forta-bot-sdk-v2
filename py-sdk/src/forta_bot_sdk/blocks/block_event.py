from .block import Block


class BlockEvent:
    def __init__(self, dict):
        self.chain_id: int = dict.get('chain_id', dict.get('network'))
        block = dict.get('block', {})
        self.block: Block = block if isinstance(block, Block) else Block(block)

    @property
    def network(self):
        return self.chain_id

    @property
    def block_hash(self):
        return self.block.hash

    @property
    def block_number(self):
        return self.block.number
