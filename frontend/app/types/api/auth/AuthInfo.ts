import type { Nullable } from "~/types/Nullable";

export interface AuthInfo {
  access_token: string;
  token_type: string;
  user_id: number;
  role_id: number;
  user: Nullable<{
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  }>;
}
