"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { getAuthCallbackUrl } from "@/lib/supabase/app-url";
import { prisma } from "@/lib/db";
import { ROLE_HOME } from "@/lib/auth/roles";
import {
  DEMO_STUDENT_ID,
  isDemoBypassEnabled,
  setDemoSession,
} from "@/lib/auth/demo-session";

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
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return {
        error:
          "Confirm your email first (check spam). Log in does not send a new email — use the link from signup, or sign up again after disabling confirm email in Supabase.",
      };
    }
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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthCallbackUrl("/onboarding"),
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return {
      message:
        "Account created. Check your inbox (and spam) for a confirmation link, then log in. Email/password login does not send a new email.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function demoLoginAction(): Promise<void> {
  if (!isDemoBypassEnabled()) {
    redirect("/login?error=demo");
  }

  const user = await prisma.user.findUnique({
    where: { id: DEMO_STUDENT_ID },
    select: { id: true, role: true },
  });

  if (!user) {
    redirect("/login?error=demo-data");
  }

  await setDemoSession(user.id);
  revalidatePath("/", "layout");
  redirect(ROLE_HOME[user.role]);
}
