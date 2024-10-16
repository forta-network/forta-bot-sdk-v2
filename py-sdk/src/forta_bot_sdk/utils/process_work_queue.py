import asyncio
from typing import Callable, Optional

ProcessWorkQueue = Callable[[asyncio.Queue, Callable, Optional[int]], None]


def provide_process_work_queue() -> ProcessWorkQueue:

    async def process_work_queue(work_queue: asyncio.Queue, worker: Callable, num_workers: int = 1):
        # fire up worker tasks to process the work queue
        tasks = []
        for i in range(num_workers):
            task = asyncio.create_task(worker(work_queue))
            tasks.append(task)

        # wait for work queue to be completely processed
        await work_queue.join()

        # clean up all worker tasks
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)

    return process_work_queue
