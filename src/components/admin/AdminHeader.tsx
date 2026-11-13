import Link from "next/link";
import { logout } from "@/app/admin/actions";
export function AdminHeader() {
  return <header className="admin-header">
    <Link href="/admin" className="admin-brand">NEXT AGENCY <span>ადმინი</span></Link>
    <nav><Link href="/ka" target="_blank">საიტი ↗</Link><form action={logout}><button className="admin-link">გასვლა</button></form></nav>
  </header>;
}
