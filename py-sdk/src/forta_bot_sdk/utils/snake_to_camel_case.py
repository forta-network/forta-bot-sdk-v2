
def snake_to_camel_case(val: str) -> str:
    camel_case = "".join(x.capitalize() for x in val.lower().split("_"))
    return f'{val[0].lower()}{camel_case[1:]}'
