import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "admin" | "manager" | "user" | "student";
export type Theme = "gold" | "blue" | "night";
export type Lang = "ru" | "tj" | "en";

export interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender?: string;
  birthDate?: string;
  email?: string;
  photo?: string;
  role: Role;
  isBanned?: boolean;
  createdAt: number;
  lastSeen?: number;
}

export interface Answer {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface Question {
  id: string;
  testId: string;
  text: string;
  type: "single" | "multiple";
  order: number;
  explanation?: string;
  answers?: Answer[];
}

export interface Test {
  id: string;
  title: string;
  description?: string;
  authorId: string;
  type: "training" | "rating1" | "rating2" | "exam";
  scope: "personal" | "shared";
  status: "pending" | "approved" | "rejected";
  timeLimit?: number;
  passingScore?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  chatType: "general" | "private" | "admin";
  senderId: string;
  receiverId?: string;
  text?: string;
  attachment?: string;
  isDeleted?: boolean;
  createdAt: number;
}

interface AppState {
  user: User | null;
  theme: Theme;
  lang: Lang;
  isOnline: boolean;
  
  setUser: (user: User | null) => void;
  setTheme: (theme: Theme) => void;
  setLang: (lang: Lang) => void;
  setOnline: (v: boolean) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      theme: "gold",
      lang: "ru",
      isOnline: true,
      
      setUser: (user) => set({ user }),
      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
      setOnline: (isOnline) => set({ isOnline }),
      logout: () => set({ user: null }),
    }),
    { name: "jtest-store" }
  )
);
