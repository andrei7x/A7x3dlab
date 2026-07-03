import { ResetPasswordPage } from "@/auth/ResetPasswordPage";

type ResetPasswordRouteProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordRoute({ searchParams }: ResetPasswordRouteProps) {
  const params = await searchParams;
  return <ResetPasswordPage token={params.token || ""} />;
}
