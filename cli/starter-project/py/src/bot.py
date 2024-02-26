import asyncio
from web3 import AsyncWeb3
from forta_bot import scan_ethereum, scan_polygon, scan_alerts, Finding, FindingSeverity, FindingType, BlockEvent, TransactionEvent, AlertEvent, run_health_check

ERC20_TRANSFER_EVENT = '{"name":"Transfer","type":"event","anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}]}'
TETHER_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
TETHER_DECIMALS = 6
findings_count = 0


async def handle_transaction(tx_event: TransactionEvent, provider: AsyncWeb3):
    findings = []

    # limiting this bot to emit only 5 findings so that the alert feed is not spammed
    global findings_count
    if findings_count >= 5:
        return findings

    # filter the transaction logs for any Tether transfers
    tether_transfer_events = tx_event.filter_log(
        ERC20_TRANSFER_EVENT, TETHER_ADDRESS)

    for transfer_event in tether_transfer_events:
        # extract transfer event arguments
        to = transfer_event['args']['to']
        from_ = transfer_event['args']['from']
        value = transfer_event['args']['value']
        # shift decimals of transfer value
        normalized_value = value / 10 ** TETHER_DECIMALS

        # if more than 10,000 Tether were transferred, report it
        if normalized_value > 10000:
            findings.append(Finding({
                'name': 'High Tether Transfer',
                'description': f'High amount of USDT transferred: {normalized_value}',
                'alert_id': 'FORTA-1',
                'severity': FindingSeverity.Low,
                'type': FindingType.Info,
                'metadata': {
                    'to': to,
                    'from': from_,
                },
                'source': {
                    'chains': [{'chain_id': tx_event.chain_id}]
                }
            }))
            findings_count += 1

    return findings


async def main():
    await asyncio.gather(
        scan_ethereum({
            'rpc_url': 'https://cloudflare-eth.com/',
            'handle_transaction': handle_transaction
        }),

        # scan_polygon({
        #     'rpc_url': 'https://polygon-mainnet.g.alchemy.com/v2',
        #     'rpc_key_id': 'd7f5e66f-0deb-4002-a52d-9b17ad254b38',
        #     'local_rpc_url': '137',
        #     'handle_block': handle_block
        # }),

        # scan_alerts({
        #   'subscriptions': [{'bot_id': '0xbotId123'}]
        #   'handle_alert': handle_alert,
        # }),

        # health checks are required to run on scan nodes (i.e. not needed for external bots)
        run_health_check()
    )

if __name__ == "__main__":
    asyncio.run(main())
