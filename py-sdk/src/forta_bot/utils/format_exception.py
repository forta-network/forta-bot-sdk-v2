
import traceback


def format_exception(e) -> str:
    return "".join(traceback.format_exception(e))
