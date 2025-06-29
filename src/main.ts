#!/usr/bin/env node

import { validateConfig } from "./config.js";
import { transformTweet } from "./transform.js";
import { postTweet, validateCredentials } from "./post.js";
import { loadCharacter } from "./character.js";
import { Character } from "./types/character.js";

interface CLIOptions {
  character?: string;
  dryRun?: boolean;
  verbose?: boolean;
  listCharacters?: boolean;
}

function parseArgs(args: string[]): { text: string; options: CLIOptions } {
  const options: CLIOptions = {};
  const textArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === "--character" && i + 1 < args.length) {
      options.character = args[++i];
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--list-characters") {
      options.listCharacters = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      textArgs.push(arg);
    }
  }

  return {
    text: textArgs.join(" ").trim(),
    options,
  };
}

function printHelp(): void {
  console.log(`
Tweet Filter - Transform and post tweets with AI

Usage:
  tweet-filter [options] <tweet text>

Options:
  --character <name>  Use a character file for transformation (required)
  --dry-run           Transform the tweet but don't post it
  --verbose, -v       Show detailed output
  --list-characters   List available character files
  --help, -h          Show this help message

Examples:
  tweet-filter --character techie "Fixed a bug today"
  tweet-filter --character philosopher "Working on something cool"
  tweet-filter --character gen-z-creator "Just shipped a new feature!"
  tweet-filter --character ./my-character.json "Custom character tweet"
  tweet-filter --dry-run --character techie "Testing transformation"

Character Files:
  Characters provide rich personality-driven transformations with:
  - Detailed personality traits and backstory
  - Example posts and conversation style
  - Topic preferences and knowledge areas
  - Consistent voice and tone

  Built-in characters: techie, philosopher, gen-z-creator
  Or provide a path to your own character JSON file.
`);
}

async function listCharacters(): Promise<void> {
  const { readdir } = await import("fs/promises");
  const { join } = await import("path");
  
  console.log("\nAvailable character files:");
  console.log("=" .repeat(50));
  
  try {
    const charactersDir = join(process.cwd(), "characters");
    const files = await readdir(charactersDir);
    const jsonFiles = files.filter(f => f.endsWith(".json"));
    
    for (const file of jsonFiles) {
      const name = file.replace(".json", "");
      try {
        const character = await loadCharacter(name);
        console.log(`\n${name}:`);
        console.log(`  Name: ${character.name}`);
        console.log(`  Bio: ${character.bio[0]}`);
        console.log(`  Personality: ${character.adjectives.slice(0, 5).join(", ")}...`);
      } catch (error) {
        console.log(`\n${name}: [Error loading character]`);
      }
    }
  } catch (error) {
    console.log("No characters directory found.");
  }
  
  console.log("\nTo use a character: tweet-filter --character <name> \"Your tweet\"");
}

async function main(): Promise<void> {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const { text, options } = parseArgs(args);

    // Handle list characters command
    if (options.listCharacters) {
      await listCharacters();
      process.exit(0);
    }
    
    // Validate configuration
    validateConfig();
    
    if (args.length === 0 || !text) {
      console.error("Error: No tweet text provided");
      printHelp();
      process.exit(1);
    }

    // Character is required
    if (!options.character) {
      console.error("Error: --character option is required");
      printHelp();
      process.exit(1);
    }

    // Load character
    let character: Character;
    {
    if (options.verbose) {
      console.log(`Loading character: ${options.character}`);
    }
    try {
      character = await loadCharacter(options.character);
      if (options.verbose) {
        console.log(`Loaded character: ${character.name}`);
      }
    } catch (error) {
      console.error(`Error loading character: ${error instanceof Error ? error.message : "Unknown error"}`);
      process.exit(1);
    }
    }

    if (options.verbose) {
      console.log("Original tweet:", text);
      console.log("Character:", character.name);
    }

    // Transform the tweet
    console.log("Transforming tweet...");
    const transformedText = await transformTweet(text, { 
      character: character 
    });

    console.log("\nTransformed tweet:");
    console.log(`"${transformedText}"`);
    console.log(`\nCharacter count: ${transformedText.length}/280`);

    // Check if dry run
    if (options.dryRun) {
      console.log("\n[Dry run mode - tweet not posted]");
      return;
    }

    // Validate Twitter credentials
    if (options.verbose) {
      console.log("\nValidating Twitter credentials...");
    }
    
    const credentialsValid = await validateCredentials();
    if (!credentialsValid) {
      throw new Error("Invalid Twitter API credentials");
    }

    // Post the tweet
    console.log("\nPosting tweet...");
    const result = await postTweet(transformedText);
    
    console.log("\n✅ Tweet posted successfully!");
    console.log(`Tweet ID: ${result.id}`);
    
    if (options.verbose) {
      console.log(`Posted at: ${result.createdAt}`);
    }

  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});