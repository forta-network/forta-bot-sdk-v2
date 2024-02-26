from datetime import datetime
from aiohttp import web
from typing import Callable, Optional
from ..metrics import MetricsManager
from ..utils import assert_exists, Logger
from ..common import HealthCheck


RunHealthCheck = Callable[[Optional[HealthCheck]], None]


def provide_run_health_check(metrics_manager: MetricsManager, health_check_port: int, logger: Logger):
    assert_exists(metrics_manager, 'metrics_manager')
    assert_exists(logger, 'logger')

    async def run_health_check(handler: Optional[HealthCheck] = None):
        # define the HTTP request handler
        async def health_check_handler(request):
            status: int = 200
            errors: list[str] = []
            try:
                if handler:
                    response = await handler()
                    if response and len(response) > 0:
                        errors = response
            except Exception as e:
                logger.error(f'{datetime.now().isoformat()}    health_check')
                logger.error(e)
                status = 500
                errors = [str(e)]
            return web.json_response({'errors': errors, 'metrics': metrics_manager.flush_metrics()}, status=status)

        # run the http server
        server = web.Application()
        server.add_routes([web.get('/health', health_check_handler)])
        runner = web.AppRunner(server)
        await runner.setup()
        site = web.TCPSite(runner, port=health_check_port)
        await site.start()

    return run_health_check
