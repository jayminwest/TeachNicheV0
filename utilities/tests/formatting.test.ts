/**
 * Tests for formatting utilities
 */

import { formatPrice, calculateFees } from "../formatting/currency";
import { formatDate, formatDateTime, getRelativeTimeFromNow } from "../formatting/date";
import { 
  capitalizeWords, 
  truncateString, 
  stripHtml, 
  slugify 
} from "../formatting/string";
import { cn } from "../formatting/ui";

describe("Currency formatting", () => {
  test("formatPrice formats a number as USD currency", () => {
    expect(formatPrice(10)).toBe("$10.00");
    expect(formatPrice(10.5)).toBe("$10.50");
    expect(formatPrice(0)).toBe("$0.00");
  });

  test("calculateFees calculates platform fee and instructor amount", () => {
    const { platformFee, instructorAmount } = calculateFees(1000);
    expect(platformFee).toBe(150); // 15% of 1000
    expect(instructorAmount).toBe(850); // 85% of 1000
  });
});

describe("Date formatting", () => {
  test("formatDate formats dates correctly", () => {
    const date = new Date("2025-04-15T12:00:00Z");
    expect(formatDate(date)).toMatch(/Apr 15, 2025/);
  });

  test("formatDateTime includes time in the formatted date", () => {
    const date = new Date("2025-04-15T12:00:00Z");
    const formatted = formatDateTime(date);
    expect(formatted).toContain("2025");
    expect(formatted).toContain("Apr");
    expect(formatted).toContain("15");
    // Time will vary based on timezone, so we just check basic format
  });

  test("getRelativeTimeFromNow returns relative time string", () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000); // 24 hours ago
    
    expect(getRelativeTimeFromNow(yesterday)).toContain("day");
  });
});

describe("String formatting", () => {
  test("capitalizeWords capitalizes first letter of each word", () => {
    expect(capitalizeWords("hello world")).toBe("Hello World");
    expect(capitalizeWords("HELLO WORLD")).toBe("Hello World");
  });

  test("truncateString truncates strings that exceed max length", () => {
    expect(truncateString("Short string", 20)).toBe("Short string");
    expect(truncateString("This is a very long string", 10)).toBe("This is a...");
  });

  test("stripHtml removes HTML tags", () => {
    expect(stripHtml("<p>Text with <strong>HTML</strong></p>")).toBe("Text with HTML");
  });

  test("slugify creates URL-friendly slugs", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
    expect(slugify("  Spaces  and-dashes  ")).toBe("spaces-and-dashes");
  });
});

describe("UI formatting", () => {
  test("cn combines class names correctly", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
    expect(cn("class1", { active: true, disabled: false })).toBe("class1 active");
  });
});
