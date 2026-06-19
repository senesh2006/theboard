import { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { runJobFinderPipeline } from "@/lib/agent/pipeline";
import { jsonError, jsonOk } from "@/lib/api-response";
import { agentChatSchema } from "@/lib/validations/agent";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Unauthorized", 401);
  if (user.role !== Role.STUDENT) {
    return jsonError("Only students can use the job finder agent", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = agentChatSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  try {
    const result = await runJobFinderPipeline(
      user,
      parsed.data.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    );

    return jsonOk(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Agent request failed";
    console.error("Agent chat error:", error);
    return jsonError(message, 502);
  }
}
