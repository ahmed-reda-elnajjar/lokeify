export function formatPrice(amount: number, currency: string): string {
  return `${amount.toLocaleString("en-US")} ${currency}`;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
