import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates Belgian VAT number format
 * Format: BE followed by 10 digits (first digit is 0 or 1)
 * Example: BE0791920272 or BE1234567890
 */
export function isValidBelgianVAT(vatNumber: string): boolean {
  if (!vatNumber) return false;
  
  // Remove spaces and dots, convert to uppercase
  const cleaned = vatNumber.replace(/[\s.]/g, "").toUpperCase();
  
  // Must start with BE followed by 10 digits
  const regex = /^BE[01]\d{9}$/;
  if (!regex.test(cleaned)) return false;
  
  // Belgian VAT checksum validation (mod 97)
  const number = parseInt(cleaned.slice(2), 10);
  const checkDigits = number % 100;
  const baseNumber = Math.floor(number / 100);
  const expectedCheck = 97 - (baseNumber % 97);
  
  return checkDigits === expectedCheck;
}

/**
 * Formats a Belgian VAT number to standard format
 * Input: be0791920272, BE 0791 920 272, etc.
 * Output: BE0791920272
 */
export function formatBelgianVAT(vatNumber: string): string {
  if (!vatNumber) return "";
  return vatNumber.replace(/[\s.]/g, "").toUpperCase();
}
