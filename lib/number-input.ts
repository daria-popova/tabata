export function sanitizeNumericText(value: string) {
  return value.replace(/[^\d]/g, '');
}

export function parsePositiveInteger(value: string) {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

export function parseNonNegativeInteger(value: string) {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
}
