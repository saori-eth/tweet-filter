import { TwitterApi, TwitterApiReadWrite } from "twitter-api-v2";
import { config } from "./config.js";

let twitterClient: TwitterApiReadWrite | null = null;

function getTwitterClient(): TwitterApiReadWrite {
  if (twitterClient) {
    return twitterClient;
  }

  const client = new TwitterApi({
    appKey: config.twitter.consumerKey!,
    appSecret: config.twitter.consumerSecret!,
    accessToken: config.twitter.accessToken!,
    accessSecret: config.twitter.accessTokenSecret!,
  });
  
  twitterClient = client.readWrite;
  return twitterClient;
}

export interface PostTweetResult {
  id: string;
  text: string;
  createdAt: string;
}

export async function postTweet(text: string): Promise<PostTweetResult> {
  if (!text || text.trim().length === 0) {
    throw new Error("Tweet text cannot be empty");
  }

  if (text.length > config.tweet.maxLength) {
    throw new Error(`Tweet exceeds ${config.tweet.maxLength} character limit`);
  }

  try {
    const client = getTwitterClient();
    
    // Post the tweet using v2 API
    const result = await client.v2.tweet(text);
    
    return {
      id: result.data.id,
      text: result.data.text,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof Error) {
      // Check for rate limit
      if (error.message.includes("429")) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      // Check for authentication errors
      if (error.message.includes("401") || error.message.includes("403")) {
        throw new Error("Authentication failed. Please check your Twitter API credentials.");
      }
      throw new Error(`Failed to post tweet: ${error.message}`);
    }
    throw new Error("Failed to post tweet: Unknown error");
  }
}

export async function validateCredentials(): Promise<boolean> {
  try {
    const client = getTwitterClient();
    // Verify credentials by getting user info
    await client.v2.me();
    return true;
  } catch (error) {
    return false;
  }
}