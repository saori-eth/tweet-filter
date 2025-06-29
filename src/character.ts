import { readFile } from "fs/promises";
import { join, resolve } from "path";
import { Character, isValidCharacter } from "./types/character.js";

export class CharacterNotFoundError extends Error {
  constructor(characterPath: string) {
    super(`Character file not found: ${characterPath}`);
    this.name = "CharacterNotFoundError";
  }
}

export class InvalidCharacterError extends Error {
  constructor(characterPath: string, details?: string) {
    super(`Invalid character file: ${characterPath}${details ? ` - ${details}` : ""}`);
    this.name = "InvalidCharacterError";
  }
}

export async function loadCharacter(pathOrName: string): Promise<Character> {
  let characterPath: string;
  
  // Check if it's a full path or just a name
  if (pathOrName.endsWith(".json")) {
    characterPath = resolve(pathOrName);
  } else {
    // Look in default characters directory
    characterPath = join(process.cwd(), "characters", `${pathOrName}.json`);
  }

  try {
    const content = await readFile(characterPath, "utf-8");
    const data = JSON.parse(content);
    
    if (!isValidCharacter(data)) {
      throw new InvalidCharacterError(characterPath, "File does not match character schema");
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      if ("code" in error && error.code === "ENOENT") {
        throw new CharacterNotFoundError(characterPath);
      }
      if (error instanceof SyntaxError) {
        throw new InvalidCharacterError(characterPath, "Invalid JSON");
      }
    }
    throw error;
  }
}

export function buildCharacterPrompt(character: Character): string {
  const sections: string[] = [];
  
  // Add name and basic info
  sections.push(`You are ${character.name}.`);
  
  // Add bio snippets
  if (character.bio.length > 0) {
    sections.push("\nAbout you:");
    sections.push(...character.bio.map(bio => `- ${bio}`));
  }
  
  // Add key traits
  if (character.adjectives.length > 0) {
    sections.push(`\nYour personality traits: ${character.adjectives.join(", ")}`);
  }
  
  // Add topics of interest
  if (character.topics.length > 0) {
    sections.push(`\nTopics you care about: ${character.topics.join(", ")}`);
  }
  
  // Add style guidelines
  sections.push("\nYour writing style:");
  sections.push(...character.style.all.map(style => `- ${style}`));
  sections.push("\nSpecifically for tweets/posts:");
  sections.push(...character.style.post.map(style => `- ${style}`));
  
  // Add post examples
  if (character.postExamples.length > 0) {
    sections.push("\nExamples of your tweets:");
    sections.push(...character.postExamples.map((example, i) => `${i + 1}. "${example}"`));
  }
  
  return sections.join("\n");
}

export function extractMessageStyle(character: Character): string {
  const examples: string[] = [];
  
  // Extract text from message examples
  for (const conversation of character.messageExamples) {
    for (const message of conversation) {
      if (message.user === character.name) {
        examples.push(message.content.text);
      }
    }
  }
  
  return examples.join("\n");
}