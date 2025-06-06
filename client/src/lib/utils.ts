import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gets the initials from a name
 * @param name The name to get initials from
 * @returns The initials (up to 2 characters)
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Formats a date string to a locale date string
 * @param dateString The date string to format
 * @returns The formatted date string
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}

/**
 * Formats bytes to human readable format
 * @param bytes The number of bytes
 * @param decimals Number of decimal places to show
 * @returns Formatted byte string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Creates a query client fetcher for TanStack Query
 */
export const fetcher = async (url: string) => {
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = new Error("An error occurred while fetching the data.");
    error.message = await response.text();
    throw error;
  }
  
  return response.json();
};