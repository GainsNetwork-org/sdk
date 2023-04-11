export const pack = (values: bigint[], bitLengths: bigint[]): bigint => {
  if (values.length !== bitLengths.length) {
    throw new Error("Mismatch in the lengths of values and bitLengths arrays");
  }

  let packed = BigInt(0);
  let currentShift = BigInt(0);

  for (let i = 0; i < values.length; i++) {
    if (currentShift + bitLengths[i] > BigInt(256)) {
      throw new Error("Packed value exceeds 256 bits");
    }

    const maxValue = (BigInt(1) << bitLengths[i]) - BigInt(1);
    if (values[i] > maxValue) {
      throw new Error("Value too large for specified bit length");
    }

    const maskedValue = values[i] & maxValue;
    packed |= maskedValue << currentShift;
    currentShift += bitLengths[i];
  }

  return packed;
};

export const unpack = (packed: bigint, bitLengths: bigint[]): bigint[] => {
  const values: bigint[] = [];

  let currentShift = BigInt(0);
  for (let i = 0; i < bitLengths.length; i++) {
    if (currentShift + bitLengths[i] > BigInt(256)) {
      throw new Error("Unpacked value exceeds 256 bits");
    }

    const maxValue = (BigInt(1) << bitLengths[i]) - BigInt(1);
    const mask = maxValue << currentShift;
    values[i] = (packed & mask) >> currentShift;

    currentShift += bitLengths[i];
  }

  return values;
};
