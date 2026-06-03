import { useMemo, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { aiAdvisorApi } from "../../api/api";
import { cn } from "../../utils/cn";

const starterPrompts = [
  "Recommend something funny for tonight",
  "I want an action movie under 2 hours",
  "What should I watch with my family?",
];

function createAssistantMessage(reply, suggestions = [], detectedPreferences = []) {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    text: reply,
    suggestions,
    detectedPreferences,
  };
}

export default function MovieAdvisorChat() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState(() => [
    createAssistantMessage(
      "Tell me what mood, genre, runtime, or age rating you want. I will suggest movies from the CinemaTick catalog.",
      [],
      []
    ),
  ]);

  const canSend = input.trim().length > 0 && !isLoading;
  const panelTitle = useMemo(() => (isLoading ? "Finding picks" : "AI Movie Advisor"), [isLoading]);

  function openPanel() {
    setIsOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function closePanel() {
    setIsOpen(false);
  }

  async function sendMessage(messageText = input) {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || isLoading) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmedMessage,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await aiAdvisorApi.ask({ message: trimmedMessage });
      setMessages((currentMessages) => [
        ...currentMessages,
        createAssistantMessage(
          response.reply,
          response.suggestions || [],
          response.detectedPreferences || []
        ),
      ]);
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        createAssistantMessage(
          error.message || "I could not reach the movie advisor right now.",
          [],
          []
        ),
      ]);
    } finally {
      setIsLoading(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  function openMovie(suggestion) {
    const reference = suggestion.slug || suggestion.id;
    if (!reference) return;

    setIsOpen(false);
    navigate(`/movies/${reference}`);
  }

  return (
    <div className="fixed bottom-[20px] right-[20px] z-50 flex max-w-[calc(100vw-32px)] flex-col items-end gap-[12px]">
      {isOpen && (
        <section className="flex h-[min(640px,calc(100vh-104px))] w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden rounded-tk-8 border border-app-border bg-app-surface/95 shadow-2xl shadow-black/20 backdrop-blur-md">
          <header className="flex items-center justify-between border-b border-app-border bg-app-surface-soft/80 px-[16px] py-[12px]">
            <div className="flex min-w-0 items-center gap-[10px]">
              <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-tk-8 bg-brand text-neutral-900">
                <Bot className="h-[19px] w-[19px]" />
              </span>
              <div className="min-w-0">
                <h2 className="type-h6 truncate text-app-text">{panelTitle}</h2>
                <p className="type-body-xs truncate text-app-text-muted">
                  Content-based catalog recommendations
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closePanel}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-tk-8 text-app-text-muted transition hover:bg-app-surface-soft hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label="Close AI advisor"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto bg-app-background/70 px-[14px] py-[14px]">
            <div className="flex flex-col gap-[12px]">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onOpenMovie={openMovie}
                />
              ))}

              {isLoading && (
                <div className="flex items-center gap-[8px] self-start rounded-tk-8 bg-app-surface px-[12px] py-[10px] type-body-s text-app-text-muted">
                  <Loader2 className="h-[16px] w-[16px] animate-spin" />
                  Checking the catalog
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-app-border bg-app-surface/95 px-[14px] py-[12px]">
            <div className="mb-[10px] flex gap-[8px] overflow-x-auto pb-[2px]">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  disabled={isLoading}
                  className="shrink-0 rounded-tk-8 border border-app-border px-[10px] py-[7px] type-body-xs text-app-text-muted transition hover:border-brand hover:text-brand disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex items-end gap-[8px]">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                rows={1}
                maxLength={500}
                placeholder="Ask for a movie..."
                className="max-h-[96px] min-h-[44px] flex-1 resize-none rounded-tk-8 border border-app-border bg-app-background px-[12px] py-[11px] type-body-s text-app-text outline-none transition placeholder:text-app-text-subtle focus:border-brand"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-tk-8 bg-brand text-neutral-900 transition hover:bg-brand-hover disabled:bg-app-surface-soft disabled:text-app-text-subtle"
                aria-label="Send message"
              >
                <Send className="h-[18px] w-[18px]" />
              </button>
            </form>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={isOpen ? closePanel : openPanel}
        className={cn(
          "flex h-[56px] items-center gap-[10px] rounded-tk-8 border border-brand/40 bg-brand px-[16px] text-neutral-900 shadow-xl shadow-black/35 transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-app-background",
          isOpen && "bg-app-surface text-app-text hover:bg-app-surface-soft"
        )}
        aria-label={isOpen ? "Close AI movie advisor" : "Open AI movie advisor"}
      >
        {isOpen ? <X className="h-[20px] w-[20px]" /> : <Sparkles className="h-[20px] w-[20px]" />}
        <span className="type-button-m hidden sm:inline">AI Advisor</span>
      </button>
    </div>
  );
}

function ChatMessage({ message, onOpenMovie }) {
  const isUser = message.role === "user";

  return (
    <article className={cn("flex flex-col gap-[8px]", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[86%] rounded-tk-8 px-[12px] py-[10px] type-body-s",
          isUser
            ? "bg-brand text-neutral-900"
            : "bg-app-surface text-app-text"
        )}
      >
        {message.text}
      </div>

      {!isUser && message.detectedPreferences?.length > 0 && (
        <div className="flex max-w-full flex-wrap gap-[6px]">
          {message.detectedPreferences.map((preference) => (
            <span
              key={preference}
              className="rounded-tk-4 border border-app-border px-[7px] py-[3px] type-body-xs text-app-text-muted"
            >
              {preference}
            </span>
          ))}
        </div>
      )}

      {!isUser && message.suggestions?.length > 0 && (
        <div className="grid w-full gap-[8px]">
          {message.suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => onOpenMovie(suggestion)}
              className="grid grid-cols-[52px_1fr] gap-[10px] rounded-tk-8 border border-app-border bg-app-background p-[8px] text-left transition hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <div className="aspect-[2/3] overflow-hidden rounded-tk-4 bg-neutral-700">
                {suggestion.posterUrl ? (
                  <img
                    src={suggestion.posterUrl}
                    alt={suggestion.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-app-text-subtle">
                    <MessageCircle className="h-[18px] w-[18px]" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-start justify-between gap-[8px]">
                  <h3 className="type-body-s font-semibold text-app-text">{suggestion.title}</h3>
                  {suggestion.rating != null && (
                    <span className="shrink-0 type-body-xs text-brand">
                      {Number(suggestion.rating).toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="mt-[2px] truncate type-body-xs text-app-text-muted">
                  {(suggestion.genres || []).slice(0, 3).join(", ") || "Cinema pick"}
                </p>
                <p className="mt-[6px] line-clamp-2 type-body-xs text-app-text-subtle">
                  {suggestion.reason}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
