export type RussianPluralForms = readonly [one: string, few: string, many: string];

export function pluralizeRu(value: number, forms: RussianPluralForms): string {
  const absValue = Math.abs(value);
  const lastTwoDigits = absValue % 100;
  const lastDigit = absValue % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return forms[2];
  }

  if (lastDigit === 1) {
    return forms[0];
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return forms[1];
  }

  return forms[2];
}

export function formatRuCount(value: number, forms: RussianPluralForms): string {
  return `${value} ${pluralizeRu(value, forms)}`;
}
