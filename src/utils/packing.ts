export const pack64To256 = (
  x: bigint,
  y: bigint,
  z: bigint,
  w: bigint
): bigint => {
  let packed = BigInt(0);
  packed |= x;
  packed |= y << BigInt(34);
  packed |= z << BigInt(68);
  packed |= w << BigInt(102);
  return packed;
};

export const unpack256To64 = (
  packed: bigint
): [bigint, bigint, bigint, bigint] => {
  const x = packed & BigInt("0x3FFFFFFFF");
  const y = (packed >> BigInt(34)) & BigInt("0x3FFFFFFFF");
  const z = (packed >> BigInt(68)) & BigInt("0x3FFFFFFFF");
  const w = (packed >> BigInt(102)) & BigInt("0x3FFFFFFFF");
  return [x, y, z, w];
};
