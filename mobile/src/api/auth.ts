import { api } from "./client";
import type { User } from "@/types";

export const authAPI = {
  login: (email: string, password: string) =>
    api.post<{ access: string; refresh: string; user: User; message: string }>(
      "/user/login/",
      { email, password }
    ),

  register: (payload: Record<string, unknown>) =>
    api.post<{ message: string }>("/user/register/", payload),

  logout: (refresh: string) => api.post("/user/logout/", { refresh }),

  getProfile: () => api.get<User>("/user/profile/"),

  updateProfile: (payload: Partial<User>) =>
    api.put<User>("/user/profile/", payload),
};
