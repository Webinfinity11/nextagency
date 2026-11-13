import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { LoginForm } from "@/components/admin/LoginForm";
export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return <main className="admin-login"><LoginForm /></main>;
}
