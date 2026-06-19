"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AgentMessageList } from "@/components/agent/agent-message-list";
import {
  AGENT_STARTER_PROMPTS,
  useAgentChat,
  type JobOption,
} from "@/components/agent/use-agent-chat";

type JobFinderAgentProps = {
  listings: JobOption[];
};

export function JobFinderAgent({ listings }: JobFinderAgentProps) {
  const chat = useAgentChat(listings);

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[520px] flex-col gap-4 lg:flex-row">
      <Card className="flex flex-1 flex-col overflow-hidden p-0">
        <AgentMessageList
          messages={chat.messages}
          loading={chat.loading}
          adviceLoading={chat.adviceLoading}
          listRef={chat.listRef}
          onNavigate={chat.handleNavigate}
        />

        <div className="border-t border-slate-200 p-4">
          {chat.error ? <p className="mb-2 text-sm text-red-600">{chat.error}</p> : null}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void chat.sendMessage(chat.input);
            }}
            className="flex gap-2"
          >
            <input
              value={chat.input}
              onChange={(event) => chat.setInput(event.target.value)}
              placeholder="Ask me to find jobs, check applications, or open a page…"
              disabled={chat.busy}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-50"
            />
            <Button type="submit" disabled={chat.busy || !chat.input.trim()}>
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
              value={chat.selectedListingId}
              onChange={(event) => chat.setSelectedListingId(event.target.value)}
              disabled={listings.length === 0 || chat.busy}
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
            disabled={!chat.selectedListingId || chat.busy}
            onClick={() => void chat.handleApplicationAdvice()}
          >
            {chat.adviceLoading ? "Analyzing CV…" : "Get application advice"}
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
            {AGENT_STARTER_PROMPTS.map((prompt) => (
              <li key={prompt}>
                <button
                  type="button"
                  disabled={chat.busy}
                  onClick={() => void chat.sendMessage(prompt)}
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
