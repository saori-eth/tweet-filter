import OpenAI from "openai";
import { config } from "./config.js";
import { Character } from "./types/character.js";
import { buildCharacterPrompt } from "./character.js";

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export interface TransformOptions {
  character: Character;
  maxLength?: number;
}

export async function transformTweet(
  text: string, 
  options: TransformOptions
): Promise<string> {
  const maxLength = options.maxLength || config.tweet.maxLength;
  
  // Build character-based prompts
  const systemPrompt = buildCharacterPrompt(options.character);
  const userPrompt = `Rewrite the following tweet in your unique voice and style.
Keep it under ${maxLength} characters (including spaces and punctuation).
Maintain the core message but express it as YOU would, using your personality, tone, and writing style.
Do not add hashtags unless they were in the original tweet.
Return ONLY the rewritten tweet text, nothing else.

Original tweet:
"${text}"`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const transformed = completion.choices[0]?.message?.content?.trim();
    
    if (!transformed) {
      throw new Error("No response from OpenAI");
    }

    // Ensure the tweet is within length limit
    if (transformed.length > maxLength) {
      // Try again with more emphasis on length
      const retryPrompt = `Express this idea in YOUR voice in EXACTLY ${maxLength} characters or less: "${text}"`;
        
      const retryCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: retryPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      });

      const retryTransformed = retryCompletion.choices[0]?.message?.content?.trim();
      
      if (!retryTransformed || retryTransformed.length > maxLength) {
        throw new Error(`Tweet exceeds ${maxLength} character limit`);
      }

      return retryTransformed;
    }

    return transformed;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw error;
  }
}