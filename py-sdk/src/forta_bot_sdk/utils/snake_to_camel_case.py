
def snake_to_camel_case(val: str) -> str:
    result = ''
    capitalize_next = False
    for char in val:
        if char == '_':
            capitalize_next = True
        else:
            if capitalize_next:
                result = f'{result}{char.upper()}'
                capitalize_next = False
            else:
                result = f'{result}{char}'
    return result
