import murmurHash3 from "murmurhash3js";
import { decode } from "base64-arraybuffer";

// partial bloom filter implementation (read-only) that matches Go implementation at https://github.com/bits-and-blooms/bloom
export class BloomFilter {
  public bitSet: BitSet | undefined;

  constructor(
    public readonly m: number | string,
    public readonly k: number | string,
    public readonly base64Data: string
  ) {
    if (typeof this.m === "string") {
      this.m = Number(this.m);
    }
    if (typeof this.k === "string") {
      this.k = Number(this.k);
    }
    // create bitset lazily
    this.bitSet = undefined;
  }

  // returns true if key is in bloom filter, else false
  public has(key: string): boolean {
    if (this.bitSet == undefined) {
      this.bitSet = new BitSet(Number(this.m), this.base64Data);
    }
    var indices = this.getIndices(key);
    for (var i = 0; i < indices.length; i++) {
      if (!this.bitSet.has(indices[i])) {
        return false;
      }
    }
    return true;
  }

  private getIndices(key: string) {
    const indices: number[] = [];
    const baseHashes = this.getBaseHashes(key);

    for (let i = 0; i < Number(this.k); i++) {
      let ii = BigInt(i);
      let a = baseHashes[Number(ii % BigInt(2))];
      let b = (ii + (ii % BigInt(2))) % BigInt(4);
      let c = BigInt(2) + b / BigInt(2);
      let d = BigInt.asUintN(64, ii * baseHashes[Number(c)]);
      const location = BigInt.asUintN(64, a + d);
      indices.push(Number(location % BigInt(this.m)));
    }
    return indices;
  }

  // returns 4 64-bit hashes using murmur3 hash (x64, 128-bit implementation)
  private getBaseHashes(key: string) {
    const keyBuffer = Buffer.from(key);
    // compute 128-bit hash from key and split to get 2 64-bit hashes
    const hash1 = murmurHash3.x64.hash128(key);
    const val1 = Buffer.from(hash1.substring(0, 16), "hex").readBigUInt64BE();
    const val2 = Buffer.from(hash1.substring(16), "hex").readBigUInt64BE();
    // compute second 128-bit hash by appending 1 to key
    const hash2 = murmurHash3.x64.hash128(
      Buffer.concat([keyBuffer, Buffer.from([1])]).toString()
    );
    const val3 = Buffer.from(hash2.substring(0, 16), "hex").readBigUInt64BE();
    const val4 = Buffer.from(hash2.substring(16), "hex").readBigUInt64BE();
    return [val1, val2, val3, val4];
  }
}

class BitSet {
  private readonly data: BigUint64Array;

  constructor(public readonly m: number, public readonly base64Data: string) {
    // first Uint64 (i.e. 8 bytes) encodes m, next Uint64 encodes k, next Uint64 encodes m again (so we slice them out)
    const buffer = decode(base64Data).slice(8 * 3);
    const dataView = new DataView(buffer);
    const arrayLength = Math.ceil(this.m / 64); // how many Uint64 do we need to store m bits
    this.data = new BigUint64Array(arrayLength);
    for (let i = 0; i < arrayLength; i++) {
      this.data[i] = dataView.getBigUint64(8 * i, false); // read as big endian
    }
  }

  public has(index: number): boolean {
    const wordIndex = index >> 6;
    const wordsIndexI = index & (64 - 1);
    const mask = BigInt(Math.pow(2, wordsIndexI));
    const word = this.data[wordIndex];
    return (word & mask) !== BigInt(0);
  }
}
