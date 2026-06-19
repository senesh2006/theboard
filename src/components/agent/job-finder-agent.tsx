"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { readJsonResponse } from "@/lib/read-json-response";
import type {
  AgentListingSummary,
  AgentNavigation,
  AgentStep,
} from "@/lib/agent/types";

type JobOption = {
  id: string;
  title: string;
  district: string | null;
  isRemote: boolean;
  isPartTime: boolean;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  listings?: AgentListingSummary[];
  navigation?: AgentNavigation[];
  steps?: AgentStep[];
};

type JobFinderAgentProps = {
  listings: JobOption[];
};

const STARTER_PROMPTS = [
  "Find remote part-time jobs for me",
  "What jobs match my skills?",
  "Show my application status",
  "Search for internships in my district",
];

export function JobFinderAgent({ listings }: JobFinderAgentProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I can search jobs, read your CV, and give tailored advice when you pick a listing. Build your CV on your profile, select a job on the right, then click Get application advice.",
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedListingId, setSelectedListingId] = useState(listings[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedListing = listings.find((listing) => listing.id === selectedListingId);

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
      scrollToBottom();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleApplicationAdvice() {
    if (!selectedListingId || adviceLoading || loading) return;

    const listing = selectedListing;
    if (!listing) {
      setError("Select a job listing first.");
      return;
    }

    setError(null);
    setAdviceLoading(true);

    const userMessage = `Give me application advice for: ${listing.title}`;
    const nextMessages: ChatMessage[] = [
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
                        {listing.excerpt ? (
                          <p className="mt-1 text-xs text-slate-600">{listing.excerpt}</p>
                        ) : null}
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

          {loading || adviceLoading ? (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm text-slate-500">
                {adviceLoading ?
                  "Reading your CV and analyzing the job…"
                : "Searching listings and navigating the app…"}
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-200 p-4">
          {error ? <p className="mb-2 text-sm text-red-600">{error}</p> : null}
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
              disabled={loading || adviceLoading}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-50"
            />
            <Button type="submit" disabled={loading || adviceLoading || !input.trim()}>
              Send
            </Button>
          </form>
        </div>
      </Card>

      <Card className="w-full shrink-0 space-y-6 p-4 lg:w-80">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">CV application advice</h2>
          <p className="mt-1 text-xs text-slate-500">
            Select a job. The agent reads your saved CV and suggests how to improve your
            application.
          </p>

          <div className="mt-3 space-y-2">
            <Label htmlFor="listing-select">Job listing</Label>
            <select
              id="listing-select"
              value={selectedListingId}
              onChange={(event) => setSelectedListingId(event.target.value)}
              disabled={listings.length === 0 || adviceLoading || loading}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-50"
            >
              {listings.length === 0 ? (
                <option value="">No active listings</option>
              ) : (
                listings.map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {listing.title}
                    {listing.district ? ` · ${listing.district}` : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          <Button
            type="button"
            className="mt-3 w-full"
            disabled={!selectedListingId || adviceLoading || loading}
            onClick={() => void handleApplicationAdvice()}
          >
            {adviceLoading ? "Analyzing CV…" : "Get application advice"}
          </Button>

          <Link
            href="/student/profile"
            className="mt-2 block text-center text-xs font-medium text-indigo-600 hover:underline"
          >
            Edit CV on your profile
          </Link>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-900">Try asking</h2>
          <ul className="mt-3 space-y-2">
            {STARTER_PROMPTS.map((prompt) => (
              <li key={prompt}>
                <button
                  type="button"
                  disabled={loading || adviceLoading}
                  onClick={() => void sendMessage(prompt)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50"
                >
                  {prompt}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-500">
          Powered by NVIDIA NIM. Advice uses your profile CV and the selected listing.
        </p>
      </Card>
    </div>
  );
}
