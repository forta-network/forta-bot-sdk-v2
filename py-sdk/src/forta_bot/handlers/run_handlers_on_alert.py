from datetime import datetime
from typing import Callable, Optional
from ..alerts import Alert, CreateAlertEvent, GetAlert
from ..findings import Finding
from ..metrics import MetricsHelper
from ..common import ScanAlertsOptions
from ..utils import assert_exists, assert_findings, Logger, format_exception

RunHandlersOnAlert = Callable[[str | Alert,
                               ScanAlertsOptions, Optional[bool]], list[Finding]]


def provide_run_handlers_on_alert(
    get_alert: GetAlert,
    create_alert_event: CreateAlertEvent,
    metrics_helper: MetricsHelper,
    logger: Logger
) -> RunHandlersOnAlert:
    assert_exists(get_alert, 'get_alert')
    assert_exists(create_alert_event, 'create_alert_event')
    assert_exists(metrics_helper, 'metrics_helper')
    assert_exists(logger, 'logger')

    async def run_handlers_on_alert(
            alert_or_hash: str | Alert,
            options: ScanAlertsOptions,
            should_stop_on_errors: bool = True) -> list[Finding]:
        handle_alert = options.get('handle_alert')
        if not handle_alert:
            raise Exception("no alert handler provided")

        # if passed in a string hash
        if type(alert_or_hash) == str:
            logger.log(f'fetching alert {alert_or_hash}...')
            alert = await get_alert(alert_or_hash)
        else:
            # if passed in an alert
            alert = alert_or_hash

        findings = []
        try:
            alert_event = create_alert_event(alert)
            metrics_helper.start_handle_alert_timer(alert.hash)
            findings = await handle_alert(alert_event)
            metrics_helper.end_handle_alert_timer(alert.hash)

            assert_findings(findings)
            logger.log(
                f'{len(findings)} findings for alert {alert.hash} {findings if len(findings) > 0 else ""}')
            metrics_helper.report_handle_alert_success(len(findings))
        except Exception as e:
            metrics_helper.report_handle_alert_error()
            logger.error(
                f'{datetime.now().isoformat()}    handle_alert {alert.hash}')
            if should_stop_on_errors:
                raise e
            logger.error(format_exception(e))

        return findings

    return run_handlers_on_alert
