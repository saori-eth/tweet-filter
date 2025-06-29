import { describe, it, expect, vi } from "vitest";
import { loadCharacter, buildCharacterPrompt } from "../character.js";
import { Character } from "../types/character.js";
import { readFile } from "fs/promises";

vi.mock("fs/promises");

describe("loadCharacter", () => {
  const mockCharacter: Character = {
    name: "TestBot",
    bio: ["Test bio"],
    lore: ["Test lore"],
    messageExamples: [[{ user: "TestBot", content: { text: "Hello!" } }]],
    postExamples: ["Test post"],
    adjectives: ["test"],
    topics: ["testing"],
    style: {
      all: ["Be test-like"],
      chat: ["Chat like a test"],
      post: ["Post like a test"],
    },
  };

  it("should load character from name", async () => {
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify(mockCharacter));
    
    const character = await loadCharacter("testbot");
    
    expect(character).toEqual(mockCharacter);
    expect(readFile).toHaveBeenCalledWith(
      expect.stringContaining("characters/testbot.json"),
      "utf-8"
    );
  });

  it("should load character from full path", async () => {
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify(mockCharacter));
    
    const character = await loadCharacter("/custom/path/character.json");
    
    expect(character).toEqual(mockCharacter);
    expect(readFile).toHaveBeenCalledWith("/custom/path/character.json", "utf-8");
  });

  it("should throw CharacterNotFoundError for missing file", async () => {
    const error = new Error("ENOENT") as any;
    error.code = "ENOENT";
    vi.mocked(readFile).mockRejectedValueOnce(error);
    
    await expect(loadCharacter("missing")).rejects.toThrow("Character file not found");
  });

  it("should throw InvalidCharacterError for invalid JSON", async () => {
    vi.mocked(readFile).mockResolvedValueOnce("{ invalid json");
    
    await expect(loadCharacter("invalid")).rejects.toThrow("Invalid character file");
  });

  it("should throw InvalidCharacterError for invalid schema", async () => {
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify({ name: "Test" }));
    
    await expect(loadCharacter("incomplete")).rejects.toThrow("File does not match character schema");
  });
});

describe("buildCharacterPrompt", () => {
  it("should build a complete character prompt", () => {
    const character: Character = {
      name: "TestBot",
      bio: ["A test bot", "Loves testing"],
      lore: ["Created for tests"],
      messageExamples: [],
      postExamples: ["Test tweet 1", "Test tweet 2"],
      adjectives: ["helpful", "precise"],
      topics: ["testing", "quality"],
      style: {
        all: ["Be clear", "Be concise"],
        chat: ["Be friendly"],
        post: ["Be engaging", "Use emojis wisely"],
      },
    };

    const prompt = buildCharacterPrompt(character);
    
    expect(prompt).toContain("You are TestBot");
    expect(prompt).toContain("A test bot");
    expect(prompt).toContain("Loves testing");
    expect(prompt).toContain("helpful, precise");
    expect(prompt).toContain("testing, quality");
    expect(prompt).toContain("Be clear");
    expect(prompt).toContain("Be engaging");
    expect(prompt).toContain("Test tweet 1");
  });

  it("should handle character with minimal fields", () => {
    const character: Character = {
      name: "MinimalBot",
      bio: [],
      lore: [],
      messageExamples: [],
      postExamples: [],
      adjectives: [],
      topics: [],
      style: {
        all: ["Simple"],
        chat: [],
        post: [],
      },
    };

    const prompt = buildCharacterPrompt(character);
    
    expect(prompt).toContain("You are MinimalBot");
    expect(prompt).toContain("Simple");
    expect(prompt).not.toContain("About you:");
    expect(prompt).not.toContain("personality traits:");
  });
});