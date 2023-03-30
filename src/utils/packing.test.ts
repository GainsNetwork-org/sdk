import { pack64To256, unpack256To64 } from "./packing";

describe("pack64To256 and unpack256To64", () => {
  test("should correctly pack and unpack 4 values", () => {
    const x = BigInt(1000000000);
    const y = BigInt(2000000000);
    const z = BigInt(3000000000);
    const w = BigInt(4000000000);

    const packed = pack64To256(x, y, z, w);
    const unpacked = unpack256To64(packed);

    expect(unpacked[0]).toEqual(x);
    expect(unpacked[1]).toEqual(y);
    expect(unpacked[2]).toEqual(z);
    expect(unpacked[3]).toEqual(w);
  });

  test("should correctly pack and unpack 2 values", () => {
    const x = BigInt(1000000000);
    const y = BigInt(2000000000);

    const packed = pack64To256(x, y, BigInt(0), BigInt(0));
    const unpacked = unpack256To64(packed);

    expect(unpacked[0]).toEqual(x);
    expect(unpacked[1]).toEqual(y);
  });
});
