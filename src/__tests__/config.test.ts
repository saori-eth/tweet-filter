import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { validateConfig } from "../config.js";

describe("validateConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {};
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should pass with valid credentials", () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.X_CONSUMER_KEY = "consumer-key";
    process.env.X_CONSUMER_SECRET = "consumer-secret";
    process.env.X_ACCESS_TOKEN = "access-token";
    process.env.X_ACCESS_TOKEN_SECRET = "access-secret";

    expect(() => validateConfig()).not.toThrow();
  });

  it("should throw if OpenAI API key is missing", () => {
    process.env.X_CONSUMER_KEY = "consumer-key";
    process.env.X_CONSUMER_SECRET = "consumer-secret";
    process.env.X_ACCESS_TOKEN = "access-token";
    process.env.X_ACCESS_TOKEN_SECRET = "access-secret";

    expect(() => validateConfig()).toThrow("OPENAI_API_KEY is required");
  });

  it("should throw if Twitter credentials are missing", () => {
    process.env.OPENAI_API_KEY = "test-key";

    expect(() => validateConfig()).toThrow(/Twitter API credentials are required/);
  });

  it("should throw if incomplete Twitter credentials", () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.X_CONSUMER_KEY = "consumer-key";
    // Missing other credentials

    expect(() => validateConfig()).toThrow(/Twitter API credentials are required/);
  });
});