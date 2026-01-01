
export const AuthStore = {
  getAccessToken(): string | undefined {
    return localStorage.getItem("access_token") ?? undefined;
  },
  setAccessToken(token?: string) {
    if (!token) {
      localStorage.removeItem("access_token");
    } else {
      localStorage.setItem("access_token", token);
    }
  },
  clear() {
    localStorage.removeItem("access_token");
  },
};
