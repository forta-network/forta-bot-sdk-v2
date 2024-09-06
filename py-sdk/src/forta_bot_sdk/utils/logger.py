
# import logging
from .now import now


class Logger:
    def __init__(self, is_prod: bool = False, is_debug: bool = False, is_logging_disabled: bool = False):
        # TODO make use of built-in python logging module
        self.is_prod = is_prod
        self.is_debug = is_debug
        self.is_logging_disabled = is_logging_disabled
        # if (self.is_debug):
        # enable debug-level logs from all other Python modules
        # logging.basicConfig(level=logging.DEBUG)

    def debug(self, msg):
        if self.is_logging_disabled or not self.is_debug:
            return
        print(f'{now()} {msg}')

    def log(self, msg):
        if self.is_logging_disabled or (self.is_prod and not self.is_debug):
            return
        print(msg)

    def info(self, msg):
        if self.is_logging_disabled:
            return
        print(msg)

    def error(self, msg, force_print=False):
        if self.is_logging_disabled and not force_print:
            return
        print(msg)
