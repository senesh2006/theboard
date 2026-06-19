import type { AgentMessage, NimToolDefinition } from "@/lib/agent/types";

type NimChatCompletionResponse = {
  choices: Array<{
    message: AgentMessage;
    finish_reason: string;
  }>;
  error?: { message: string };
};

function getNimConfig() {
  const apiKey = process.env.NVIDIA_API_KEY;
  const baseUrl =
    process.env.NVIDIA_NIM_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
  const model =
    process.env.NVIDIA_NIM_MODEL ?? "meta/llama-3.1-70b-instruct";

  if (!apiKey) {
    throw new Error(
      "NVIDIA_API_KEY is not configured. Add it to your environment variables.",
    );
  }

  return { apiKey, baseUrl, model };
}

export async function createNimChatCompletion(
  messages: AgentMessage[],
  tools: NimToolDefinition[],
): Promise<AgentMessage> {
  const { apiKey, baseUrl, model } = getNimConfig();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.3,
      max_tokens: 1024,
      stream: false,
    }),
  });

  const data = (await response.json()) as NimChatCompletionResponse;

  if (!response.ok) {
    const message =
      data.error?.message ??
      `NVIDIA NIM request failed with status ${response.status}`;
    throw new Error(message);
  }

  const choice = data.choices[0];
  if (!choice?.message) {
    throw new Error("NVIDIA NIM returned an empty response");
  }

  return choice.message;
}
