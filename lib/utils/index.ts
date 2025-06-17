import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const capitalizeFirstLetters = (str: string) => {
  return str.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

export { posthog } from "./posthog"
