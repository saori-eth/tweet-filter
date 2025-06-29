import { describe, it, expect, vi, beforeEach } from "vitest";
import { transformTweet } from "../transform.js";
import { Character } from "../types/character.js";
import OpenAI from "openai";

vi.mock("openai");
vi.mock("../config.js", () => ({
  config: {
    openai: { apiKey: "test-key" },
    tweet: { maxLength: 280 }
  }
}));

describe("transformTweet", () => {
  let mockCreate: ReturnType<typeof vi.fn>;
  const mockCharacter: Character = {
    name: "TestBot",
    bio: ["A test character"],
    lore: ["Created for testing"],
    messageExamples: [],
    postExamples: ["Test tweet example"],
    adjectives: ["test", "mock"],
    topics: ["testing"],
    style: {
      all: ["Be test-like"],
      chat: ["Chat like a test"],
      post: ["Post like a test"],
    },
  };

  beforeEach(() => {
    mockCreate = vi.fn();
    vi.mocked(OpenAI).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    } as any));
  });

  it("should transform a tweet with character", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "This is a test transformation!",
          },
        },
      ],
    });

    const result = await transformTweet("Just shipped a new feature!", {
      character: mockCharacter,
    });
    
    expect(result).toBe("This is a test transformation!");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: "system",
            content: expect.stringContaining("You are TestBot"),
          }),
        ]),
      })
    );
  });

  it("should handle empty response from OpenAI", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "",
          },
        },
      ],
    });

    await expect(
      transformTweet("Test tweet", { character: mockCharacter })
    ).rejects.toThrow("No response from OpenAI");
  });

  it("should retry if tweet exceeds character limit", async () => {
    const longTweet = "A".repeat(281);
    const shortTweet = "A concise tweet";

    mockCreate
      .mockResolvedValueOnce({
        choices: [{ message: { content: longTweet } }],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: shortTweet } }],
      });

    const result = await transformTweet("Test tweet", { character: mockCharacter });
    
    expect(result).toBe(shortTweet);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("should throw error if retry also exceeds limit", async () => {
    const longTweet = "A".repeat(281);

    mockCreate.mockResolvedValue({
      choices: [{ message: { content: longTweet } }],
    });

    await expect(
      transformTweet("Test tweet", { character: mockCharacter })
    ).rejects.toThrow("Tweet exceeds 280 character limit");
  });

  it("should handle OpenAI API errors", async () => {
    mockCreate.mockRejectedValueOnce(
      new OpenAI.APIError(400, { error: { message: "Bad request" } }, "Bad request", new Headers())
    );

    await expect(
      transformTweet("Test tweet", { character: mockCharacter })
    ).rejects.toThrow("OpenAI API error: Bad request");
  });

  it("should use custom maxLength if provided", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: "Short tweet",
          },
        },
      ],
    });

    const result = await transformTweet("Test tweet", { 
      character: mockCharacter,
      maxLength: 100,
    });
    
    expect(result).toBe("Short tweet");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("100 characters"),
          }),
        ]),
      })
    );
  });
});