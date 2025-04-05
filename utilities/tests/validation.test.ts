/**
 * Tests for validation utilities
 */

import { 
  getVideoExtension, 
  isValidVideoFormat, 
  isValidVideoSize,
  ALLOWED_VIDEO_EXTENSIONS,
  MAX_VIDEO_SIZE_BYTES
} from "../validation/file-validation";

import {
  isValidEmail,
  isValidUrl,
  meetsMinLength,
  isInRange,
  isValidPrice
} from "../validation/input-validation";

describe("File validation", () => {
  test("getVideoExtension extracts file extension correctly", () => {
    expect(getVideoExtension("video.mp4")).toBe("mp4");
    expect(getVideoExtension("video.MP4")).toBe("mp4");
    expect(getVideoExtension("video")).toBe(null);
  });

  test("isValidVideoFormat validates video extensions", () => {
    expect(isValidVideoFormat("mp4")).toBe(true);
    expect(isValidVideoFormat("mov")).toBe(true);
    expect(isValidVideoFormat("txt")).toBe(false);
    expect(isValidVideoFormat(null)).toBe(false);
  });

  test("isValidVideoSize validates file size", () => {
    expect(isValidVideoSize(1000)).toBe(true);
    expect(isValidVideoSize(MAX_VIDEO_SIZE_BYTES)).toBe(true);
    expect(isValidVideoSize(MAX_VIDEO_SIZE_BYTES + 1)).toBe(false);
  });

  test("ALLOWED_VIDEO_EXTENSIONS contains expected formats", () => {
    expect(ALLOWED_VIDEO_EXTENSIONS).toContain("mp4");
    expect(ALLOWED_VIDEO_EXTENSIONS).toContain("mov");
    expect(ALLOWED_VIDEO_EXTENSIONS).toContain("avi");
    expect(ALLOWED_VIDEO_EXTENSIONS).toContain("webm");
  });
});

describe("Input validation", () => {
  test("isValidEmail validates email addresses", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user.name@example.co.uk")).toBe(true);
    expect(isValidEmail("invalid-email")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

  test("isValidUrl validates URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://example.com/path?query=1")).toBe(true);
    expect(isValidUrl("not a url")).toBe(false);
    expect(isValidUrl("")).toBe(false);
  });

  test("meetsMinLength validates string length", () => {
    expect(meetsMinLength("password", 8)).toBe(true);
    expect(meetsMinLength("short", 8)).toBe(false);
    expect(meetsMinLength("", 1)).toBe(false);
  });

  test("isInRange validates numeric ranges", () => {
    expect(isInRange(5, 1, 10)).toBe(true);
    expect(isInRange(1, 1, 10)).toBe(true);
    expect(isInRange(10, 1, 10)).toBe(true);
    expect(isInRange(0, 1, 10)).toBe(false);
    expect(isInRange(11, 1, 10)).toBe(false);
  });

  test("isValidPrice validates price values", () => {
    expect(isValidPrice(10)).toBe(true);
    expect(isValidPrice(10.50)).toBe(true);
    expect(isValidPrice(10.999)).toBe(false); // Too many decimal places
    expect(isValidPrice(0)).toBe(false); // Must be greater than zero
    expect(isValidPrice(-10)).toBe(false); // Cannot be negative
  });
});
