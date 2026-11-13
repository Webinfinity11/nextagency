import Link from "next/link";
import { db } from "@/lib/db";
import { logout } from "@/app/admin/actions";
export async function AdminHeader() {
  const unread = await db.message.count({ where: { read: false } });
  return <header className="admin-header">
    <Link href="/admin" className="admin-brand">NEXT AGENCY <span>ადმინი</span></Link>
    <nav>
      <Link href="/admin">პროექტები</Link>
      <Link href="/admin/messages">შეტყობინებები{unread > 0 && <b className="admin-badge">{unread}</b>}</Link>
      <Link href="/ka" target="_blank">საიტი ↗</Link>
      <form action={logout}><button className="admin-link">გასვლა</button></form>
    </nav>
  </header>;
}
