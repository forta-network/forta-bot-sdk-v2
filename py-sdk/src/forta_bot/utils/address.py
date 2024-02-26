from web3 import Web3
import rlp


def format_address(address) -> str:
    return address.lower() if type(address) == str else address


def is_zero_address(address: str) -> bool:
    return address is None or "0x0000000000000000000000000000000000000000" == address


def get_create_address(from_: str, nonce: int) -> str:
    from_bytes = bytes.fromhex(from_[2:])
    return f'0x{Web3.keccak(rlp.encode([from_bytes, nonce])).hex()[-40:]}'
