import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

interface AiProvider {
  generateCompletion(systemPrompt: string, userPrompt: string): Promise<string>;
}

class ClaudeProvider implements AiProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
    const message = await this.client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    const block = message.content[0];
    if (block?.type === "text") return block.text;
    throw new Error("Unexpected response type from Claude");
  }
}

class GeminiProvider implements AiProvider {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 1024,
      },
    });
    return response.text ?? "";
  }
}

class OpenAIProvider implements AiProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1024,
    });
    return completion.choices[0]?.message?.content ?? "";
  }
}

function createProvider(): AiProvider {
  const provider = (process.env["AI_PROVIDER"] ?? "claude").toLowerCase();

  if (provider === "claude") {
    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set in environment");
    return new ClaudeProvider(apiKey);
  }
  if (provider === "gemini") {
    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) throw new Error("GEMINI_API_KEY not set in environment");
    return new GeminiProvider(apiKey);
  }
  if (provider === "openai") {
    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) throw new Error("OPENAI_API_KEY not set in environment");
    return new OpenAIProvider(apiKey);
  }

  throw new Error(`Unknown AI_PROVIDER: "${provider}". Use "claude", "gemini", or "openai".`);
}

function buildProvider(name: string, apiKey: string): AiProvider {
  const n = name.toLowerCase();
  if (n === "claude") return new ClaudeProvider(apiKey);
  if (n === "gemini") return new GeminiProvider(apiKey);
  if (n === "openai") return new OpenAIProvider(apiKey);
  throw new Error(`Unknown provider: "${name}". Use "claude", "gemini", or "openai".`);
}

let envInstance: AiProvider | null = null;

function getEnvProvider(): AiProvider {
  if (!envInstance) envInstance = createProvider();
  return envInstance;
}

export interface AiRequestOptions {
  provider?: string;
  apiKey?: string;
}

export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  options?: AiRequestOptions
): Promise<string> {
  if (options?.provider && options?.apiKey) {
    return buildProvider(options.provider, options.apiKey).generateCompletion(
      systemPrompt,
      userPrompt
    );
  }
  return getEnvProvider().generateCompletion(systemPrompt, userPrompt);
}
