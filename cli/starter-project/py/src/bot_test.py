import pytest
from unittest.mock import Mock
from forta_bot_sdk import FindingSeverity, FindingType, create_transaction_event
from bot import handle_transaction, ERC20_TRANSFER_EVENT, TETHER_ADDRESS, TETHER_DECIMALS

mock_chain_id = 1
mock_tx_event = create_transaction_event(
    {"from": '0xabc', 'to': '0xdef', 'hash': '0x123'}, {}, mock_chain_id)
mock_tx_event.filter_log = Mock()
mock_provider = Mock()


class TestHighTetherTransferAgent:
    @pytest.mark.asyncio
    async def test_returns_empty_findings_if_no_tether_transfers(self):
        mock_tx_event.filter_log.return_value = []

        findings = await handle_transaction(mock_tx_event, mock_provider)

        assert len(findings) == 0
        mock_tx_event.filter_log.assert_called_once_with(
            ERC20_TRANSFER_EVENT, TETHER_ADDRESS)

    @pytest.mark.asyncio
    async def test_returns_finding_if_tether_transfer_over_10k(self):
        mock_tx_event.filter_log.reset_mock()
        amount = 20000
        mock_transfer_event = {
            'args': {'value': amount * 10**TETHER_DECIMALS, 'from': '0xabc', 'to': '0xdef'}}
        mock_tx_event.filter_log.return_value = [mock_transfer_event]

        findings = await handle_transaction(mock_tx_event, mock_provider)

        assert len(findings) == 1
        mock_tx_event.filter_log.assert_called_once_with(
            ERC20_TRANSFER_EVENT, TETHER_ADDRESS)
        finding = findings[0]
        assert finding.name == "High Tether Transfer"
        assert finding.description == f'High amount of USDT transferred: {mock_transfer_event["args"]["value"] / 10**TETHER_DECIMALS}'
        assert finding.alert_id == "FORTA-1"
        assert finding.severity == FindingSeverity.Low
        assert finding.type == FindingType.Info
        assert finding.metadata['to'] == mock_transfer_event['args']['to']
        assert finding.metadata['from'] == mock_transfer_event['args']['from']
        assert len(finding.source.chains) == 1
        assert finding.source.chains[0].chain_id == mock_chain_id
        assert len(finding.source.transactions) == 1
        assert finding.source.transactions[0].hash == mock_tx_event.hash
        assert finding.source.transactions[0].chain_id == mock_tx_event.chain_id
