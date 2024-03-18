from typing import Callable
from datetime import datetime
import json
from ..utils import assert_exists, Cache
from .alert import Alert
from .get_alerts import GetAlerts, GetAlertsResponse

GetAlert = Callable[[str], Alert]

LOOKBACK_PERIOD_DAYS = 90
ONE_DAY_IN_SECONDS = 86400


def provide_get_alert(get_alerts: GetAlerts, cache: Cache) -> GetAlert:
    assert_exists(get_alerts, 'get_alerts')
    assert_exists(cache, 'cache')

    async def get_alert(alert_hash: str) -> Alert:
        # check cache first
        cached_alert = cache.get(get_cache_key(alert_hash))
        if cached_alert:
            return Alert(cached_alert)

        # fetch the alert
        end_date: int = int(datetime.now().timestamp())
        start_date: int = end_date - \
            (LOOKBACK_PERIOD_DAYS * ONE_DAY_IN_SECONDS)
        response: GetAlertsResponse = await get_alerts({
            'alert_hash': alert_hash,
            'block_date_range': {
                'start_date': datetime.fromtimestamp(start_date),
                'end_date': datetime.fromtimestamp(end_date)
            }
        })
        if len(response.alerts) == 0:
            raise Exception(f'no alert found with hash {alert_hash}')

        alert: Alert = response.alerts[0]
        cache.set(get_cache_key(alert_hash), json.loads(repr(alert)))
        return alert

    return get_alert


def get_cache_key(alert_hash: str) -> str:
    return f'{alert_hash.lower()}-alert'
