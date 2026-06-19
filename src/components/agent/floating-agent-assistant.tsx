"use client";

import { usePathname } from "next/navigation";
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
              <Button href="/student/agent" variant="ghost" size="sm">
                Expand
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
              >
                Close
              </Button>
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
                <Button
                  key={prompt}
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={chat.busy}
                  onClick={() => void chat.sendMessage(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        </LiquidGlassView>
      ) : null}

      <Button
        type="button"
        variant="primary"
        className="pointer-events-auto h-14 w-14 min-h-0 rounded-full p-0"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close job assistant" : "Open job assistant"}
        aria-expanded={open}
      >
        {open ? "Close" : "Chat"}
      </Button>
    </div>
  );
}
