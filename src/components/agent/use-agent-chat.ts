"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { readJsonResponse } from "@/lib/read-json-response";
import type {
  AgentListingSummary,
  AgentNavigation,
  AgentStep,
} from "@/lib/agent/types";

export type JobOption = {
  id: string;
  title: string;
  district: string | null;
  isRemote: boolean;
  isPartTime: boolean;
};

export type AgentChatMessage = {
  role: "user" | "assistant";
  content: string;
  listings?: AgentListingSummary[];
  navigation?: AgentNavigation[];
  steps?: AgentStep[];
};

const INITIAL_MESSAGE: AgentChatMessage = {
  role: "assistant",
  content:
    "Hi! I can search jobs, read your CV, and give application advice. Pick a job below or ask me anything.",
};

export function useAgentChat(listings: JobOption[]) {
  const router = useRouter();
  const [messages, setMessages] = useState<AgentChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [selectedListingId, setSelectedListingId] = useState(listings[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedListing = listings.find((listing) => listing.id === selectedListingId);
  const busy = loading || adviceLoading;

  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setError(null);
    setLoading(true);

    const nextMessages: AgentChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");

    const apiMessages = nextMessages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .map(({ role, content }) => ({ role, content }));

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await readJsonResponse<{
        message?: string;
        navigation?: AgentNavigation[];
        listings?: AgentListingSummary[];
        steps?: AgentStep[];
        error?: string;
      }>(res);

      if (!res.ok) {
        throw new Error(data.error ?? "Agent request failed");
      }

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: data.message ?? "Done.",
          listings: data.listings,
          navigation: data.navigation,
          steps: data.steps,
        },
      ]);
      scrollToBottom();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleApplicationAdvice() {
    if (!selectedListingId || busy) return;

    const listing = selectedListing;
    if (!listing) {
      setError("Select a job listing first.");
      return;
    }

    setError(null);
    setAdviceLoading(true);

    const userMessage = `Give me application advice for: ${listing.title}`;
    const nextMessages: AgentChatMessage[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(nextMessages);
    scrollToBottom();

    try {
      const res = await fetch("/api/agent/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: selectedListingId }),
      });

      const data = await readJsonResponse<{
        advice?: string;
        listing?: { id: string; title: string };
        error?: string;
      }>(res);

      if (!res.ok) {
        throw new Error(data.error ?? "Could not generate advice");
      }

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: data.advice ?? "No advice generated.",
          listings: data.listing ?
            [
              {
                id: data.listing.id,
                title: data.listing.title,
                district: listing.district,
                isRemote: listing.isRemote,
                isPartTime: listing.isPartTime,
                skillsRequired: [],
                excerpt: "Selected job for CV review",
              },
            ]
          : undefined,
          navigation: [
            {
              path: `/listings/${selectedListingId}`,
              label: "View job & apply",
            },
            {
              path: "/student/profile",
              label: "Edit CV",
            },
          ],
        },
      ]);
      scrollToBottom();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdviceLoading(false);
    }
  }

  function handleNavigate(path: string) {
    router.push(path);
  }

  return {
    messages,
    input,
    setInput,
    selectedListingId,
    setSelectedListingId,
    selectedListing,
    loading,
    adviceLoading,
    busy,
    error,
    listRef,
    sendMessage,
    handleApplicationAdvice,
    handleNavigate,
  };
}

export const AGENT_STARTER_PROMPTS = [
  "Find remote part-time jobs for me",
  "What jobs match my skills?",
  "Show my application status",
  "Search for internships in my district",
];
