import _ from "lodash";

export const formatAddress = (address: string) => {
  return _.isString(address) ? address.toLowerCase() : address;
};

export const isZeroAddress = (address: string | null) => {
  return "0x0000000000000000000000000000000000000000" === address;
};
