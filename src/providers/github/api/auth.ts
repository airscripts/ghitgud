import client from "@/providers/github/client";

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

const fetchAuthenticatedUser = async (
  token?: string,
  host = "github.com",
): Promise<AuthStatus> => {
  const response = token
    ? await client.validateToken(token, host)
    : await client.getTokenRequired("/user");

  const data = (await response.json()) as Record<string, unknown>;

  const user: AuthUser = {
    login: (data.login as string) ?? "",
    name: (data.name as string) ?? null,
    htmlUrl: (data.html_url as string) ?? "",
    avatarUrl: (data.avatar_url as string) ?? "",
  };

  const scopesHeader = response.headers.get("X-OAuth-Scopes");
  const scopes = scopesHeader
    ? scopesHeader
        .split(",")
        .map((scope: string) => scope.trim())
        .filter(Boolean)
    : [];

  return { user, scopes };
};

export type { AuthUser, AuthStatus };

export default { fetchAuthenticatedUser };
