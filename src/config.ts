import dotenv from "dotenv";

dotenv.config();

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  twitter: {
    consumerKey: process.env.X_CONSUMER_KEY,
    consumerSecret: process.env.X_CONSUMER_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET,
  },
  tweet: {
    maxLength: 280,
  },
} as const;

export function validateConfig(): void {
  if (!config.openai.apiKey) {
    throw new Error("OPENAI_API_KEY is required");
  }

  if (!config.twitter.consumerKey || 
      !config.twitter.consumerSecret || 
      !config.twitter.accessToken || 
      !config.twitter.accessTokenSecret) {
    throw new Error(
      "Twitter API credentials are required. Please provide: " +
      "X_CONSUMER_KEY, X_CONSUMER_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET"
    );
  }
}