import { z } from "zod";

export const agentChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
});

export type AgentChatInput = z.infer<typeof agentChatSchema>;
