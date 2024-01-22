export enum EntityType {
  Unknown,
  Address,
  Transaction,
  Block,
  Url,
}

export const ENTITY_TYPE_STRING_TO_ENUM = {
  UNKNOWN: EntityType.Unknown,
  ADDRESS: EntityType.Address,
  TRANSACTION: EntityType.Transaction,
  BLOCK: EntityType.Block,
  URL: EntityType.Url,
};
