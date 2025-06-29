export interface Message {
  user: string;
  content: {
    text: string;
    action?: string;
  };
}

export interface Knowledge {
  id: string;
  path: string;
  content: string;
}

export interface Style {
  all: string[];
  chat: string[];
  post: string[];
}

export interface Character {
  name: string;
  bio: string[];
  lore: string[];
  messageExamples: Message[][];
  postExamples: string[];
  adjectives: string[];
  topics: string[];
  knowledge?: Knowledge[];
  style: Style;
}

export interface CharacterFile {
  $schema?: string;
  [key: string]: unknown;
}

export function isValidCharacter(obj: unknown): obj is Character {
  const char = obj as Character;
  return (
    typeof char === "object" &&
    char !== null &&
    typeof char.name === "string" &&
    Array.isArray(char.bio) &&
    Array.isArray(char.lore) &&
    Array.isArray(char.messageExamples) &&
    Array.isArray(char.postExamples) &&
    Array.isArray(char.adjectives) &&
    Array.isArray(char.topics) &&
    typeof char.style === "object" &&
    Array.isArray(char.style.all) &&
    Array.isArray(char.style.chat) &&
    Array.isArray(char.style.post)
  );
}