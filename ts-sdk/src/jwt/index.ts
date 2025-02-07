import { DecodeJwt } from "./decode.jwt";
import { GetRpcJwt } from "./get.rpc.jwt";
import { GetScannerJwt } from "./get.scanner.jwt";
import { VerifyJwt } from "./verify.jwt";

export const MOCK_SCANNER_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJib3QtaWQiOiIweDEzazM4N2IzNzc2OWNlMjQyMzZjNDAzZTc2ZmMzMGYwMWZhNzc0MTc2ZTE0MTZjODYxeWZlNmMwN2RmZWY3MWYiLCJleHAiOjE2NjAxMTk0NDMsImlhdCI6MTY2MDExOTQxMywianRpIjoicWtkNWNmYWQtMTg4NC0xMWVkLWE1YzktMDI0MjBhNjM5MzA4IiwibmJmIjoxNjYwMTE5MzgzLCJzdWIiOiIweDU1NmY4QkU0MmY3NmMwMUY5NjBmMzJDQjE5MzZEMmUwZTBFYjNGNEQifQ.9v5OiiYhDoEbhZ-abbiSXa5y-nQXa104YCN_2mK7SP0";
export const MOCK_JWT = MOCK_SCANNER_JWT;

export { GetScannerJwt, GetRpcJwt, VerifyJwt, DecodeJwt };
