// import { openai } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { google } from '@ai-sdk/google';
// const google = createGoogleGenerativeAI({
//   apiKey: process.env.GEMINI_API_KEY as string,
// });
// const geminiModel = "gemini-2.0-flash";

export function getModel(provider: "gemini") {
  return provider === "gemini"
    ? google("gemini-2.0-flash")
    : null
    // openai(process.env.OPENAI_MODEL || "gpt-4o-mini");
}
