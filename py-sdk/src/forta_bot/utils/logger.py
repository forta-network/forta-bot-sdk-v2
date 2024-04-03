
# import logging
from .now import now


class Logger:
    def __init__(self, is_prod: bool, is_debug: bool):
        # TODO make use of built-in python logging module
        self.is_prod = is_prod
        self.is_debug = is_debug
        # if (self.is_debug):
        # enable debug-level logs from all other Python modules
        # logging.basicConfig(level=logging.DEBUG)

    def debug(self, msg):
        if not self.is_debug:
            return
        print(f'{now()} {msg}')

    def log(self, msg):
        if self.is_prod and not self.is_debug:
            return
        print(msg)

    def info(self, msg):
        print(msg)

    def error(self, msg):
        print(msg)
