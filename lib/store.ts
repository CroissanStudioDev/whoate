import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Participant, ReceiptItem, Session } from "@/types";

interface UserStore {
  name: string | null;
  participantId: string | null;
  setUser: (name: string, participantId: string) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      name: null,
      participantId: null,
      setUser: (name, participantId) => set({ name, participantId }),
      clearUser: () => set({ name: null, participantId: null }),
    }),
    {
      name: "whoate-user",
    }
  )
);

interface SessionStore {
  session: Session | null;
  currentReceiptIndex: number;
  currentItemIndex: number;
  setSession: (session: Session) => void;
  updateParticipant: (participant: Participant) => void;
  addReceipt: (receipt: Session["receipts"][0]) => void;
  updateItem: (receiptId: string, item: ReceiptItem) => void;
  claimItem: (
    receiptId: string,
    itemId: string,
    participantId: string,
    type: "individual" | "shared",
    sharedWith?: string[]
  ) => void;
  unclaimItem: (receiptId: string, itemId: string, participantId: string) => void;
  setCurrentReceiptIndex: (index: number) => void;
  setCurrentItemIndex: (index: number) => void;
  nextItem: () => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  session: null,
  currentReceiptIndex: 0,
  currentItemIndex: 0,

  setSession: (session) => set({ session }),

  updateParticipant: (participant) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          participants: state.session.participants.map((p) =>
            p.id === participant.id ? participant : p
          ),
        },
      };
    }),

  addReceipt: (receipt) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          receipts: [...state.session.receipts, receipt],
        },
      };
    }),

  updateItem: (receiptId, item) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          receipts: state.session.receipts.map((r) =>
            r.id === receiptId
              ? {
                  ...r,
                  items: r.items.map((i) => (i.id === item.id ? item : i)),
                }
              : r
          ),
        },
      };
    }),

  claimItem: (receiptId, itemId, participantId, type, sharedWith) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          receipts: state.session.receipts.map((r) =>
            r.id === receiptId
              ? {
                  ...r,
                  items: r.items.map((i) =>
                    i.id === itemId
                      ? {
                          ...i,
                          claims: [
                            ...i.claims.filter((c) => c.participantId !== participantId),
                            { participantId, type, sharedWith },
                          ],
                        }
                      : i
                  ),
                }
              : r
          ),
        },
      };
    }),

  unclaimItem: (receiptId, itemId, participantId) =>
    set((state) => {
      if (!state.session) return state;
      return {
        session: {
          ...state.session,
          receipts: state.session.receipts.map((r) =>
            r.id === receiptId
              ? {
                  ...r,
                  items: r.items.map((i) =>
                    i.id === itemId
                      ? {
                          ...i,
                          claims: i.claims.filter((c) => c.participantId !== participantId),
                        }
                      : i
                  ),
                }
              : r
          ),
        },
      };
    }),

  setCurrentReceiptIndex: (index) => set({ currentReceiptIndex: index }),
  setCurrentItemIndex: (index) => set({ currentItemIndex: index }),

  nextItem: () =>
    set((state) => {
      if (!state.session) return state;
      const receipt = state.session.receipts[state.currentReceiptIndex];
      if (!receipt) return state;

      if (state.currentItemIndex < receipt.items.length - 1) {
        return { currentItemIndex: state.currentItemIndex + 1 };
      }
      return state;
    }),

  clearSession: () => set({ session: null, currentReceiptIndex: 0, currentItemIndex: 0 }),
}));
