import { createNimChatCompletion } from "@/lib/agent/nim-client";
import { AGENT_SYSTEM_PROMPT, AGENT_TOOLS, executeAgentTool } from "@/lib/agent/tools";
import type {
  AgentMessage,
  AgentPipelineResult,
} from "@/lib/agent/types";
import type { SessionUser } from "@/lib/auth/session";

const MAX_TOOL_ITERATIONS = 6;

export async function runJobFinderPipeline(
  user: SessionUser,
  userMessages: AgentMessage[],
): Promise<AgentPipelineResult> {
  const navigation: AgentPipelineResult["navigation"] = [];
  const listings: AgentPipelineResult["listings"] = [];
  const steps: AgentPipelineResult["steps"] = [];

  const messages: AgentMessage[] = [
    { role: "system", content: AGENT_SYSTEM_PROMPT },
    ...userMessages.filter((message) => message.role === "user" || message.role === "assistant"),
  ];

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const assistantMessage = await createNimChatCompletion(messages, AGENT_TOOLS);
    messages.push(assistantMessage);

    const toolCalls = assistantMessage.tool_calls ?? [];
    if (toolCalls.length === 0) {
      return {
        message: assistantMessage.content?.trim() || "I couldn't generate a response.",
        navigation,
        listings,
        steps,
      };
    }

    for (const toolCall of toolCalls) {
      const result = await executeAgentTool(
        toolCall.function.name,
        toolCall.function.arguments,
        { user, navigation, listings, steps },
      );

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        name: toolCall.function.name,
        content: result,
      });
    }
  }

  const lastAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "assistant" && message.content);

  return {
    message:
      lastAssistant?.content?.trim() ??
      "I ran into too many steps. Try asking a simpler question.",
    navigation,
    listings,
    steps,
  };
}
