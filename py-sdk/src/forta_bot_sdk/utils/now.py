
from datetime import datetime


def now() -> int:
    # return number of seconds since epoch
    return int(datetime.now().timestamp())
