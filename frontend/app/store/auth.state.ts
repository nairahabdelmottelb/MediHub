import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { NullablePartial } from "~/types/Nullable";
import type { AuthInfo } from "~/types/api/auth/AuthInfo";

export interface AuthState extends NullablePartial<AuthInfo> {}

export interface AuthActions {
  setAuthInfo: (authInfo: AuthState) => void;
  logout: () => void;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      access_token: null,
      refresh_token: null,
      expires_in: null,
      token_type: null,
      user_id: null,
      role_id: null,
      user: null,

      setAuthInfo: (authInfo) =>
        set((state) => ({
          ...state,
          authInfo,
        })),

      logout: () =>
        set((state) => ({
          ...state,
          accessToken: null,
          refreshToken: null,
          expiresIn: null,
          tokenType: null,
        })),

      isLoggedIn: () => !!get().access_token,
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const getAuthState = useAuthStore.getState;
