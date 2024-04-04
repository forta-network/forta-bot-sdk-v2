
def snake_to_camel_case(val: str) -> str:
    if len(val) == 0 or "_" not in val:
        return val

    new_val = []
    should_capitalize = False
    for char in val:
        if char == "_":
            should_capitalize = True
            continue
        elif should_capitalize:
            new_val.append(char.capitalize())
            should_capitalize = False
        else:
            new_val.append(char)
    return ''.join(new_val)
