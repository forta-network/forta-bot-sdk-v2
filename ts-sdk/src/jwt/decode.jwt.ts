export type DecodeJwt = (token: string) => DecodedJwt;

export interface DecodedJwt {
  header: any;
  payload: any;
}

export function provideDecodeJwt(): DecodeJwt {
  return function decodeJwt(token: string) {
    const splitJwt = token.split(".");
    const header = JSON.parse(Buffer.from(splitJwt[0], "base64").toString());
    const payload = JSON.parse(Buffer.from(splitJwt[1], "base64").toString());

    return {
      header,
      payload,
    };
  };
}
