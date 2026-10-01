/** Blanks a zero-value numeric field so it doesn't render a "0" the user has to delete first. */
export function numberInputValue(n: number): number | string {
  return n === 0 ? '' : n
}

/** Inverse of numberInputValue — an emptied field is treated as 0. */
export function parseNumberInput(raw: string): number {
  return raw === '' ? 0 : Number(raw)
}
