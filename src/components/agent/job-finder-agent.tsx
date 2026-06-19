"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { readJsonResponse } from "@/lib/read-json-response";
import type {
  AgentListingSummary,
  AgentNavigation,
  AgentStep,
} from "@/lib/agent/types";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  listings?: AgentListingSummary[];
  navigation?: AgentNavigation[];
  steps?: AgentStep[];
};

const STARTER_PROMPTS = [
  "Find remote part-time jobs for me",
  "What jobs match my skills?",
  "Show my application status",
  "Search for internships in my district",
];

export function JobFinderAgent() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your job finder assistant. Tell me what you're looking for — remote work, part-time gigs, skills you want to use — and I'll search TheBoard and guide you to the right pages.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    setLoading(true);

    const nextMessages: ChatMessage[] = [
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

      requestAnimationFrame(() => {
        listRef.current?.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleNavigate(path: string) {
    router.push(path);
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[520px] flex-col gap-4 lg:flex-row">
      <Card className="flex flex-1 flex-col overflow-hidden p-0">
        <div
          ref={listRef}
          className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={
                message.role === "user" ? "flex justify-end" : "flex justify-start"
              }
            >
              <div
                className={
                  message.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-md bg-indigo-600 px-4 py-3 text-sm text-white"
                    : "max-w-[85%] rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm text-slate-800"
                }
              >
                <p className="whitespace-pre-wrap">{message.content}</p>

                {message.steps && message.steps.length > 0 ? (
                  <div className="mt-3 border-t border-slate-200/80 pt-3">
                    <p className="text-xs font-medium text-slate-500">Agent steps</p>
                    <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                      {message.steps.map((step, stepIndex) => (
                        <li key={stepIndex}>
                          {step.tool}: {step.summary}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {message.listings && message.listings.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {message.listings.map((listing) => (
                      <div
                        key={listing.id}
                        className="rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <Link
                          href={`/listings/${listing.id}`}
                          className="font-medium text-indigo-700 hover:underline"
                        >
                          {listing.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {listing.isRemote ? <Badge>Remote</Badge> : null}
                          {listing.isPartTime ? (
                            <Badge variant="success">Part-time</Badge>
                          ) : null}
                          {listing.district ? (
                            <Badge variant="muted">{listing.district}</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-slate-600">{listing.excerpt}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {message.navigation && message.navigation.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.navigation.map((nav) => (
                      <Button
                        key={nav.path}
                        size="sm"
                        variant="secondary"
                        onClick={() => handleNavigate(nav.path)}
                      >
                        {nav.label}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm text-slate-500">
                Searching listings and navigating the app…
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-200 p-4">
          {error ? (
            <p className="mb-2 text-sm text-red-600">{error}</p>
          ) : null}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask me to find jobs, check applications, or open a page…"
              disabled={loading}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-50"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              Send
            </Button>
          </form>
        </div>
      </Card>

      <Card className="w-full shrink-0 p-4 lg:w-72">
        <h2 className="text-sm font-semibold text-slate-900">Try asking</h2>
        <ul className="mt-3 space-y-2">
          {STARTER_PROMPTS.map((prompt) => (
            <li key={prompt}>
              <button
                type="button"
                disabled={loading}
                onClick={() => void sendMessage(prompt)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50"
              >
                {prompt}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          Powered by NVIDIA NIM. The agent searches live listings and can open
          pages inside TheBoard for you.
        </p>
      </Card>
    </div>
  );
}
