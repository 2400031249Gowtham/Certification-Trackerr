import type { User } from "@shared/schema";

const USERS_KEY = "certtrack_users_v1";

type StoredUser = User & { password?: string };

function loadUsers(): Record<string, StoredUser> {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      const demo: Record<string, StoredUser> = {
        admin: { id: "1", username: "admin", fullName: "Administrator", email: "admin@example.com", role: "admin", password: "admin123" },
        john: { id: "2", username: "john", fullName: "John Doe", email: "john@example.com", role: "user", password: "user123" },
      };
      localStorage.setItem(USERS_KEY, JSON.stringify(demo));
      return demo;
    }

    return JSON.parse(raw) as Record<string, StoredUser>;
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, StoredUser>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function registerLocal(data: { username: string; password: string; fullName: string; email: string; }): Promise<User> {
  const users = loadUsers();
  const username = data.username;
  if (users[username]) {
    throw new Error("409: Username already exists");
  }

  const id = String(Object.keys(users).length + 1);
  const user: StoredUser = { id, username, fullName: data.fullName, email: data.email, role: "user", password: data.password };
  users[username] = user;
  saveUsers(users);
  const { password, ...publicUser } = user;
  return publicUser as User;
}

export async function loginLocal(data: { username: string; password: string; }): Promise<User> {
  const users = loadUsers();
  const user = users[data.username];
  if (!user) {
    throw new Error("401: Invalid credentials");
  }

  if (user.password !== data.password) {
    throw new Error("401: Invalid credentials");
  }

  const { password, ...publicUser } = user;
  return publicUser as User;
}

export function getAllUsers(): User[] {
  const users = loadUsers();
  return Object.values(users).map((u) => {
    const { password, ...publicUser } = u;
    return publicUser as User;
  });
}
