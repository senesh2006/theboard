export type AgentToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type AgentMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  name?: string;
  tool_calls?: AgentToolCall[];
};

export type AgentNavigation = {
  path: string;
  label: string;
};

export type AgentListingSummary = {
  id: string;
  title: string;
  district: string | null;
  isRemote: boolean;
  isPartTime: boolean;
  skillsRequired: string[];
  excerpt: string;
};

export type AgentStep = {
  tool: string;
  summary: string;
};

export type AgentPipelineResult = {
  message: string;
  navigation: AgentNavigation[];
  listings: AgentListingSummary[];
  steps: AgentStep[];
};

export type NimToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};
