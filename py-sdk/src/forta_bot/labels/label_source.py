from ..utils import get_dict_val, JSONable


class LabelSource(JSONable):
    def __init__(self, dict):
        self.alert_hash: str = get_dict_val(dict, 'alert_hash')
        self.alert_id: str = get_dict_val(dict, 'alert_id')
        self.bot = LabelSourceBot(dict.get('bot')) if dict.get(
            'bot') is not None else None
        self.chain_id: int = get_dict_val(dict, 'chain_id')
        self.id: str = dict.get('id')


class LabelSourceBot(JSONable):
    def __init__(self, dict):
        self.id: str = dict.get('id')
        self.image: str = dict.get('image')
        self.image_hash: str = get_dict_val(dict, 'image_hash')
        self.manifest: str = dict.get('manifest')
