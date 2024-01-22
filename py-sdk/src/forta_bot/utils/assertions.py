def assert_is_non_empty_string(value, name) -> str:
    assert isinstance(value, str) and len(value) > 0, f'{name} must be non-empty string'
    return value

def assert_is_from_enum(value, enum, name):
    assert isinstance(value, enum), f'{name} must be valid enum value'
    return value

def assert_exists(value, name):
    assert value is not None, f'{name} is required'