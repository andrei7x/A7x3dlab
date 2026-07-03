import { storeConfig } from "@/lib/config";

export const currencyFormatter = new Intl.NumberFormat(storeConfig.locale, {
  style: "currency",
  currency: storeConfig.currency
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}
