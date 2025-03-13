import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function calculateLevel(referrals: number) {
  if (referrals >= 101) {
    return { title: "Ultra Legend", color: "text-rose-600" }
  } else if (referrals >= 51) {
    return { title: "Legend", color: "text-amber-600" }
  } else if (referrals >= 31) {
    return { title: "Leader", color: "text-blue-700" }
  } else if (referrals >= 20) {
    return { title: "Admin", color: "text-violet-600" }
  } else if (referrals >= 11) {
    return { title: "Potential Admin", color: "text-indigo-600" }
  } else if (referrals >= 6) {
    return { title: "Growing Legend", color: "text-emerald-600" }
  } else if (referrals >= 1) {
    return { title: "Fire Starter", color: "text-red-500" }
  } else {
    return { title: "Newbie", color: "text-muted-foreground" }
  }
}

export function formatDate(dateString: string): string {
  if (!dateString) return "N/A"

  const date = new Date(dateString)

  if (isNaN(date.getTime())) return "Invalid date"

  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

