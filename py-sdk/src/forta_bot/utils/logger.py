
class Logger:
    def __init__(self, is_prod: bool, is_debug: bool):
        self.is_prod = is_prod
        self.is_debug = is_debug

    def debug(self, msg):
        if not self.is_debug:
            return
        print(msg)

    def log(self, msg):
        if self.is_prod and not self.is_debug:
            return
        print(msg)

    def info(self, msg):
        print(msg)

    def error(self, msg):
        print(msg)
