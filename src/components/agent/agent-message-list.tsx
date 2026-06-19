"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AgentChatMessage } from "@/components/agent/use-agent-chat";

type AgentMessageListProps = {
  messages: AgentChatMessage[];
  loading: boolean;
  adviceLoading: boolean;
  listRef: React.Ref<HTMLDivElement>;
  onNavigate: (path: string) => void;
  compact?: boolean;
};

export function AgentMessageList({
  messages,
  loading,
  adviceLoading,
  listRef,
  onNavigate,
  compact = false,
}: AgentMessageListProps) {
  return (
    <div
      ref={listRef}
      className={`flex-1 space-y-3 overflow-y-auto ${compact ? "p-3" : "p-4 sm:p-6"}`}
    >
      {messages.map((message, index) => (
        <div
          key={index}
          className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
        >
          <div
            className={
              message.role === "user"
                ? "max-w-[90%] rounded-2xl rounded-br-md bg-indigo-600 px-3 py-2.5 text-sm text-white"
                : "max-w-[90%] rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2.5 text-sm text-slate-800"
            }
          >
            <p className="whitespace-pre-wrap">{message.content}</p>

            {!compact && message.steps && message.steps.length > 0 ? (
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
              <div className="mt-2 space-y-2">
                {message.listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="rounded-lg border border-slate-200 bg-white p-2.5"
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
              <div className="mt-2 flex flex-wrap gap-2">
                {message.navigation.map((nav) => (
                  <Button
                    key={nav.path}
                    size="sm"
                    variant="secondary"
                    onClick={() => onNavigate(nav.path)}
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
          <div className="rounded-2xl rounded-bl-md bg-slate-100 px-3 py-2.5 text-sm text-slate-500">
            {adviceLoading ?
              "Reading your CV and analyzing the job…"
            : "Searching listings…"}
          </div>
        </div>
      ) : null}
    </div>
  );
}
