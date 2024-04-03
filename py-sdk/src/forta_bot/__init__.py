from .transactions import TransactionEvent, TxEventBlock, Transaction, Receipt, CreateTransactionEvent, GetTransactionReceipt
from .blocks import BlockEvent, Block, CreateBlockEvent
from .logs import Log, FilterLogs
from .traces import Trace, TraceAction, TraceResult
from .alerts import AlertEvent, GetAlerts, SendAlerts, CreateAlertEvent
from .findings import Finding, FindingSeverity, FindingType
from .labels import Label, EntityType, GetLabels
from .scanning import ScanEvm, ScanAlerts, GetProvider
from .health import RunHealthCheck
from .jwt import MOCK_JWT, DecodeJwt, GetScannerJwt, VerifyJwt
from .utils import BloomFilter, keccak256, snake_to_camel_case, GetBotId, GetChainId, GetBotOwner, GetFortaChainId, get_create_address, logger
from .di import RootContainer

container = RootContainer()


def create_scan_evm() -> ScanEvm:
    # provide a way to create as many scan_evm as needed
    return container.scanning.scan_evm()


scan_ethereum: ScanEvm = create_scan_evm()
scan_polygon: ScanEvm = create_scan_evm()
scan_bsc: ScanEvm = create_scan_evm()
scan_avalanche: ScanEvm = create_scan_evm()
scan_arbitrum: ScanEvm = create_scan_evm()
scan_optimism: ScanEvm = create_scan_evm()
scan_fantom: ScanEvm = create_scan_evm()
scan_base: ScanEvm = create_scan_evm()

scan_alerts: ScanAlerts = container.scanning.scan_alerts()
get_alerts: GetAlerts = container.alerts.get_alerts()
send_alerts: SendAlerts = container.alerts.send_alerts()

get_labels: GetLabels = container.labels.get_labels()

decode_jwt: DecodeJwt = container.jwt.decode_jwt()
get_scanner_jwt: GetScannerJwt = container.jwt.get_scanner_jwt()
fetch_jwt: GetScannerJwt = get_scanner_jwt  # alias for backwards compatibility
verify_jwt: VerifyJwt = container.jwt.verify_jwt()

create_block_event: CreateBlockEvent = container.blocks.create_block_event()
create_transaction_event: CreateTransactionEvent = container.transactions.create_transaction_event()
create_alert_event: CreateAlertEvent = container.alerts.create_alert_event()

get_provider: GetProvider = container.scanning.get_provider()
get_transaction_receipt: GetTransactionReceipt = container.transactions.get_transaction_receipt()
get_bot_id: GetBotId = container.common.get_bot_id()
get_chain_id: GetFortaChainId = container.common.get_forta_chain_id()
get_bot_owner: GetBotOwner = container.common.get_bot_owner()
logger = container.common.logger()

run_health_check: RunHealthCheck = container.health.run_health_check()

filter_logs: FilterLogs = container.logs.filter_logs()
