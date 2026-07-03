import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/admin/AdminDashboard";
import { ADMIN_COOKIE_NAME, getAdminSessionFromCookieToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = await getAdminSessionFromCookieToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);

  if (!session) {
    redirect("/login?next=/admin");
  }

  return <AdminDashboard />;
}
