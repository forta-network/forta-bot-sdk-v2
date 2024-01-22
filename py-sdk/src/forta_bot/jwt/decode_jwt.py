import base64
from typing import Any, Callable, TypedDict

class DecodedJwt(TypedDict):
    header: Any
    payload: Any

DecodeJwt = Callable[[str], DecodedJwt]

def provide_decode_jwt() -> DecodeJwt:
    
  def decode_jwt(token):
      # Add 4 bytes for pythons b64decode
      header = base64.urlsafe_b64decode(
          token.split('.')[0] + '==').decode('utf-8')
      payload = base64.urlsafe_b64decode(
          token.split('.')[1] + '==').decode('utf-8')

      return {
          "header": header,
          "payload": payload
      }
  
  return decode_jwt