"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { ROLE_HOME } from "@/lib/auth/roles";

export type AuthActionState = {
  error?: string;
  message?: string;
};

function safeNextPath(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function getUserRole(user: { user_metadata?: Record<string, unknown> }): Role | null {
  const role = user.user_metadata?.role as Role | undefined;
  if (!role || !Object.values(Role).includes(role)) return null;
  return role;
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign-in succeeded but no session was created. Try again." };
  }

  let role = getUserRole(user);

  if (!role) {
    try {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (dbUser) {
        role = dbUser.role;
        await supabase.auth.updateUser({
          data: { role: dbUser.role, name: dbUser.name },
        });
      }
    } catch (error) {
      console.error("Could not load profile after login:", error);
    }
  }

  revalidatePath("/", "layout");

  if (!role) {
    redirect("/onboarding");
  }

  const destination =
    next === "/login" || next === "/signup" || next === "/onboarding"
      ? ROLE_HOME[role]
      : next;

  redirect(destination);
}

export async function signupAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return {
      message:
        "Account created. Check your email and confirm your address, then log in.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}
