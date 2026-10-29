import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ChatMessage = { id: string; sender: "student" | "support"; body: string; createdAt: string };
export type ChatConversation = { id: string; title: string; status: "open" | "closed"; messages: ChatMessage[]; createdAt: string };

type ChatState = {
  conversations: ChatConversation[];
  activeId: string;
  draft: string;
  setDraft: (value: string) => void;
  send: () => void;
  startNew: () => void;
  closeActive: () => void;
  setActive: (id: string) => void;
};

function newConversation(): ChatConversation {
  const now = new Date().toISOString();
  return { id: `chat-${Date.now()}`, title: "گفت‌وگوی جدید", status: "open", createdAt: now, messages: [{ id: `message-${Date.now()}`, sender: "support", body: "سلام! موضوع موردنظرتان را بنویسید تا به واحد مربوط هدایت کنیم.", createdAt: now }] };
}

const initial = newConversation();

export const useChat = create<ChatState>()(persist((set) => ({
  conversations: [initial],
  activeId: initial.id,
  draft: "",
  setDraft: (draft) => set({ draft }),
  send: () => set((state) => {
    const body = state.draft.trim();
    if (!body) return state;
    const now = new Date().toISOString();
    return {
      draft: "",
      conversations: state.conversations.map((conversation) => conversation.id === state.activeId ? {
        ...conversation,
        title: conversation.messages.length === 1 ? body.slice(0, 42) : conversation.title,
        messages: [...conversation.messages, { id: `message-${Date.now()}`, sender: "student", body, createdAt: now }, { id: `reply-${Date.now()}`, sender: "support", body: "پیام شما دریافت شد. کارشناس روابط عمومی در همین گفت‌وگو پاسخ می‌دهد.", createdAt: now }],
      } : conversation),
    };
  }),
  startNew: () => set((state) => { const conversation = newConversation(); return { conversations: [conversation, ...state.conversations], activeId: conversation.id, draft: "" }; }),
  closeActive: () => set((state) => ({ conversations: state.conversations.map((conversation) => conversation.id === state.activeId ? { ...conversation, status: "closed" } : conversation) })),
  setActive: (activeId) => set({ activeId, draft: "" }),
}), { name: "student-support-chat" }));
