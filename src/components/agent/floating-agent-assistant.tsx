"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LiquidGlassView } from "@/components/ui/liquid-glass";
import { AgentMessageList } from "@/components/agent/agent-message-list";
import {
  AGENT_STARTER_PROMPTS,
  useAgentChat,
  type JobOption,
} from "@/components/agent/use-agent-chat";

type FloatingAgentAssistantProps = {
  listings: JobOption[];
};

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

export function FloatingAgentAssistant({ listings }: FloatingAgentAssistantProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const chat = useAgentChat(listings);

  if (pathname.startsWith("/student/agent")) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open ? (
        <LiquidGlassView
          effect="regular"
          className="pointer-events-auto flex h-[min(560px,calc(100vh-6rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl shadow-2xl"
          role="dialog"
          aria-label="Job assistant chat"
        >
          <LiquidGlassView
            effect="clear"
            colorScheme="dark"
            tintColor="rgba(79, 70, 229, 0.82)"
            className="flex items-center justify-between border-b border-white/20 px-4 py-3 text-white"
          >
            <div>
              <p className="text-sm font-semibold">Job Assistant</p>
              <p className="text-xs text-indigo-100">Search jobs & CV advice</p>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/student/agent"
                className="rounded-md px-2 py-1 text-xs font-medium text-indigo-100 hover:bg-indigo-500/40"
              >
                Expand
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 hover:bg-indigo-500/40"
                aria-label="Close assistant"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" stroke="currentColor" strokeWidth="2" fill="none">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          </LiquidGlassView>

          <LiquidGlassView effect="clear" className="border-b border-white/30 p-3">
            <Label htmlFor="float-listing-select" className="text-xs">
              CV advice for job
            </Label>
            <select
              id="float-listing-select"
              value={chat.selectedListingId}
              onChange={(event) => chat.setSelectedListingId(event.target.value)}
              disabled={listings.length === 0 || chat.busy}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
            >
              {listings.length === 0 ? (
                <option value="">No listings</option>
              ) : (
                listings.map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {listing.title}
                  </option>
                ))
              )}
            </select>
            <Button
              type="button"
              size="sm"
              className="mt-2 w-full"
              disabled={!chat.selectedListingId || chat.busy}
              onClick={() => void chat.handleApplicationAdvice()}
            >
              {chat.adviceLoading ? "Analyzing…" : "Get application advice"}
            </Button>
          </LiquidGlassView>

          <AgentMessageList
            messages={chat.messages}
            loading={chat.loading}
            adviceLoading={chat.adviceLoading}
            listRef={chat.listRef}
            onNavigate={chat.handleNavigate}
            compact
          />

          <div className="border-t border-white/30 p-3">
            {chat.error ? <p className="mb-2 text-xs text-red-600">{chat.error}</p> : null}
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
                placeholder="Ask about jobs…"
                disabled={chat.busy}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 disabled:opacity-50"
              />
              <Button type="submit" size="sm" disabled={chat.busy || !chat.input.trim()}>
                Send
              </Button>
            </form>
            <div className="mt-2 flex flex-wrap gap-1">
              {AGENT_STARTER_PROMPTS.slice(0, 2).map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={chat.busy}
                  onClick={() => void chat.sendMessage(prompt)}
                  className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </LiquidGlassView>
      ) : null}

      <LiquidGlassView
        effect="regular"
        interactive
        tintColor="rgba(79, 70, 229, 0.85)"
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg focus-within:ring-2 focus-within:ring-indigo-400 focus-within:ring-offset-2"
      >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-full w-full items-center justify-center rounded-full focus:outline-none"
        aria-label={open ? "Close job assistant" : "Open job assistant"}
        aria-expanded={open}
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        ) : (
          <ChatIcon className="h-6 w-6" />
        )}
      </button>
      </LiquidGlassView>
    </div>
  );
}
