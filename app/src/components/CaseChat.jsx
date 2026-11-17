import { useState, useEffect, useRef, useCallback } from "react";
import { MessageService } from "@/services/MessageService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, ChevronUp } from "lucide-react";
import moment from "moment";

const PAGE_SIZE = 30;

export default function CaseChat({ caseId, user }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef(null);
  const seenIds = useRef(new Set());

  const addMessages = useCallback((incoming, prepend = false) => {
    const fresh = incoming.filter((m) => !seenIds.current.has(m.id));
    fresh.forEach((m) => seenIds.current.add(m.id));
    if (!fresh.length) return;
    setMessages((prev) => prepend ? [...fresh, ...prev] : [...prev, ...fresh]);
  }, []);

  const loadMessages = useCallback(async () => {
    const query = { case_id: caseId };
    const msgs = await MessageService.filter(query, "-created_date", PAGE_SIZE + 1);
    const hasNext = msgs.length > PAGE_SIZE;
    const page = hasNext ? msgs.slice(0, PAGE_SIZE) : msgs;
    // API returns newest-first; reverse to show chronological
    const ordered = [...page].reverse();
    setHasMore(hasNext);
    seenIds.current.clear();
    ordered.forEach((m) => seenIds.current.add(m.id));
    setMessages(ordered);
  }, [caseId]);

  const loadOlderMessages = useCallback(async () => {
    if (!hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    const olderMsgs = await MessageService.filter(
      { case_id: caseId },
      "-created_date",
      PAGE_SIZE + 1,
      messages.length
    );
    const hasNext = olderMsgs.length > PAGE_SIZE;
    setHasMore(hasNext);
    addMessages([...(hasNext ? olderMsgs.slice(0, PAGE_SIZE) : olderMsgs)].reverse(), true);
    setLoadingMore(false);
  }, [caseId, hasMore, loadingMore, messages, addMessages]);

  useEffect(() => {
    loadMessages();
    const unsub = MessageService.subscribe((event) => {
      if (event.data?.case_id === caseId && event.type === "create") {
        addMessages([event.data]);
      }
    });
    return () => {
      unsub();
      seenIds.current.clear();
    };
  }, [caseId, loadMessages, addMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    const text = newMsg.trim();
    const tempId = `opt-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      case_id: caseId,
      sender_name: user?.full_name || "Anonymous",
      sender_role: user?.role || "survivor",
      message: text,
      channel: "chat",
      created_by: user?.email,
      created_date: new Date().toISOString(),
    };
    seenIds.current.add(tempId);
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMsg("");
    setSending(true);
    try {
      await MessageService.create({
        case_id: caseId,
        sender_name: user?.full_name || "Anonymous",
        sender_role: user?.role || "survivor",
        message: text,
        channel: "chat",
      });
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      seenIds.current.delete(tempId);
    } catch {
      // revert optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      seenIds.current.delete(tempId);
    }
    setSending(false);
  };

  const isOwnMessage = (msg) => msg.created_by === user?.email;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col" style={{ height: "420px" }}>
      <div className="p-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">Case Chat</h3>
        {hasMore && (
          <button
            onClick={loadOlderMessages}
            disabled={loadingMore}
            className="text-[11px] text-primary flex items-center gap-1 disabled:opacity-50"
          >
            <ChevronUp className="w-3 h-3" />
            {loadingMore ? "Loading..." : "Load older"}
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Start the conversation.
          </div>
        )}
        {messages.map((msg) => {
          const own = isOwnMessage(msg);
          return (
            <div key={msg.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                own
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted rounded-bl-md"
              }`}>
                {!own && (
                  <p className="text-[10px] font-semibold mb-0.5 opacity-70">
                    {msg.sender_name} · {msg.sender_role}
                  </p>
                )}
                <p className="text-sm">{msg.message}</p>
                <p className={`text-[10px] mt-1 ${own ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {moment(msg.created_date).format("h:mm A")}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t border-border flex gap-2">
        <Input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={sending || !newMsg.trim()}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
}