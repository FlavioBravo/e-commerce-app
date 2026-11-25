export function formatMoney(value: string): string {
  const [whole, fraction = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  return `${sign}$${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

export function addMoney(values: string[]): string {
  const cents = values.reduce((total, value) => {
    const [whole, fraction = ""] = value.split(".");
    return total + Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
  }, 0);
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}
