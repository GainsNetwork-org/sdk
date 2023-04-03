import { pack, unpack } from "./packing";

describe("pack64To256 and unpack256To64", () => {
  test("should correctly pack and unpack 4 values", () => {
    const x = BigInt(200000000000000);
    const y = BigInt(300000000000);
    const z = BigInt(400000000);
    const w = BigInt(5);

    const packed = pack(
      [x, y, z, w],
      [BigInt(64), BigInt(64), BigInt(64), BigInt(64)]
    );
    const unpacked = unpack(packed, [
      BigInt(64),
      BigInt(64),
      BigInt(64),
      BigInt(64),
    ]);

    expect(unpacked[0]).toEqual(x);
    expect(unpacked[1]).toEqual(y);
    expect(unpacked[2]).toEqual(z);
    expect(unpacked[3]).toEqual(w);
  });

  test("should correctly pack and unpack 2 values", () => {
    const x = BigInt(1000000000);
    const y = BigInt(2000000000);

    const packed = pack([x, y], [BigInt(64), BigInt(64)]);
    const unpacked = unpack(packed, [BigInt(64), BigInt(64)]);

    expect(unpacked[0]).toEqual(x);
    expect(unpacked[1]).toEqual(y);
  });
});
