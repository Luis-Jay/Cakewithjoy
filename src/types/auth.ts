export type UserRole = "customer" | "staff" | "admin";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
}
