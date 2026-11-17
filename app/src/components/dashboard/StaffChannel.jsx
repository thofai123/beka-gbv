// Private staff-only messaging channel for admins & responders to coordinate.
// Real-time via StaffMessage subscription. Lives inside the admin dashboard — no screen change.

import { useEffect, useRef, useState } from "react";
import { StaffMessageService } from "@/services/StaffMessageService";
import { Send, Lock, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import { haptic } from "@/lib/haptics";

export default function StaffChannel({ user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const load = () => {
    StaffMessageService.list("-created_date", 50)
      .then((m) => setMessages((m || []).reverse()))
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const unsub = StaffMessageService.subscribe(load);
    return () => unsub?.();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    haptic.light();
    await StaffMessageService.create({
      message: body,
      sender_name: user?.full_name || "Staff",
      sender_role: user?.role === "admin" ? "admin" : "responder",
    });
    setSending(false);
    load();
  };

  return (
    <div className="w-full max-w-sm px-6 pb-4 z-10">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-[10px] tracking-widest uppercase font-semibold text-orange-400/80">
          Staff Channel · Private
        </span>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden flex flex-col" style={{ height: 320 }}>
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <ShieldCheck className="w-6 h-6 text-white/20 mb-2" />
              <p className="text-xs text-white/40">
                Private channel for staff. Coordinate responses & discuss incidents securely.
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m) => {
                const mine = m.created_by === user?.email;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${mine ? "bg-orange-500 text-black rounded-br-sm" : "bg-white/10 text-white rounded-bl-sm"}`}>
                      {!mine && (
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-[10px] font-semibold opacity-90">{m.sender_name || "Staff"}</span>
                          <span className="text-[9px] uppercase tracking-wide opacity-60">{m.sender_role}</span>
                        </div>
                      )}
                      <p className="text-xs leading-snug break-words">{m.message}</p>
                      <p className={`text-[9px] mt-0.5 ${mine ? "text-black/50" : "text-white/40"}`}>
                        {moment(m.created_date).format("HH:mm")}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-white/10 p-2 flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Message the team…"
            className="flex-1 bg-white/5 text-white placeholder:text-white/30 text-sm rounded-xl px-3 py-2 outline-none border border-white/10 focus:border-orange-400/50"
          />
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            className="w-9 h-9 rounded-xl bg-orange-500 text-black flex items-center justify-center flex-shrink-0 disabled:opacity-40 active:scale-90 transition-transform"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}