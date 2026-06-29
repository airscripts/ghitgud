interface AuthUser {
  login: string;
  htmlUrl: string;
  avatarUrl: string;
  name: string | null;
}

interface AuthStatus {
  user: AuthUser;
  scopes: string[];
}

export type { AuthUser, AuthStatus };
