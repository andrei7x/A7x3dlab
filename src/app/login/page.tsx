import { LoginPage } from "@/auth/LoginPage";

type LoginRouteProps = {
  searchParams: Promise<{ next?: string }>;
};

function safeNext(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/admin";
  return next;
}

export default async function LoginRoute({ searchParams }: LoginRouteProps) {
  const params = await searchParams;
  return <LoginPage nextUrl={safeNext(params.next)} />;
}
