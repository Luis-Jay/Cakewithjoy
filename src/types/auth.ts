export type UserRole = "customer" | "staff" | "production" | "sales" | "admin" | "baker";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  isActive: boolean;
}
