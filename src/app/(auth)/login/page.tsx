import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: { next?: string; error?: string };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const params = new URLSearchParams({ mode: "login" });
  if (searchParams.next) params.set("next", searchParams.next);
  if (searchParams.error) params.set("error", searchParams.error);
  redirect(`/?${params.toString()}`);
}
