import { createContext } from "react";

export interface AuthContextType {
  isAuthenticated: boolean;
  user: { id: number; name: string; email: string } | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
