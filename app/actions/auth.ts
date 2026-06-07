"use server";

import { redirect } from "next/navigation";
import {
  validateCredentials,
  createSession,
  deleteSession,
} from "@/app/lib/session";

export type LoginState = {
  error?: string;
} | undefined;

/**
 * Server Action: Login
 */
export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "กรุณากรอก Username และ Password" };
  }

  const validUser = validateCredentials(username, password);

  if (!validUser) {
    return { error: "Username หรือ Password ไม่ถูกต้อง" };
  }

  await createSession(validUser);
  redirect("/");
}

/**
 * Server Action: Logout
 */
export async function logout() {
  await deleteSession();
  redirect("/login");
}
