export const pack64To256 = (
  x: bigint,
  y: bigint,
  z: bigint,
  w: bigint
): bigint => {
  let packed = BigInt(0);
  packed |= x;
  packed |= y << BigInt(64);
  packed |= z << BigInt(128);
  packed |= w << BigInt(192);
  return packed;
};

export const unpack256To64 = (
  packed: bigint
): [bigint, bigint, bigint, bigint] => {
  const x = packed & BigInt("0xFFFFFFFFFFFFFFFF");
  const y = (packed >> BigInt(64)) & BigInt("0xFFFFFFFFFFFFFFFF");
  const z = (packed >> BigInt(128)) & BigInt("0xFFFFFFFFFFFFFFFF");
  const w = (packed >> BigInt(192)) & BigInt("0xFFFFFFFFFFFFFFFF");
  return [x, y, z, w];
};
