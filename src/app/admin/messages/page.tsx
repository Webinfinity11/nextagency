import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteMessage, toggleMessageRead } from "../actions";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
// Messages from the site's contact form, newest first.
export default async function Messages() {
  await requireAdmin();
  const messages = await db.message.findMany({ orderBy: { createdAt: "desc" } });
  const fmt = new Intl.DateTimeFormat("ka-GE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return <>
    <AdminHeader />
    <main className="admin-main">
      <div className="admin-title-row"><div><h1>შეტყობინებები</h1><p className="admin-muted">საიტის კონტაქტის ფორმიდან. ახალი ზემოთაა.</p></div></div>
      {messages.length === 0 ? <p className="admin-empty">ჯერ შეტყობინება არ მოსულა.</p> :
      <ol className="admin-messages">
        {messages.map(m => <li key={m.id} className={m.read ? "" : "is-new"}>
          <div className="admin-message-head">
            <div><strong>{m.name}</strong>{m.company && <span className="admin-muted"> · {m.company}</span>}<br /><a href={`mailto:${m.email}`}>{m.email}</a></div>
            <span className="admin-muted">{fmt.format(m.createdAt)} · {m.locale.toUpperCase()}</span>
          </div>
          <p className="admin-message-body">{m.body}</p>
          <div className="admin-actions">
            <a className="admin-btn" href={`mailto:${m.email}?subject=${encodeURIComponent("Re: KAI STUDIO")}`}>პასუხი</a>
            <form action={toggleMessageRead}><input type="hidden" name="id" value={m.id} /><button className="admin-btn">{m.read ? "წაუკითხავად მონიშვნა" : "წაკითხულია"}</button></form>
            <form action={deleteMessage}><input type="hidden" name="id" value={m.id} /><ConfirmButton className="admin-btn admin-btn-danger" message={`წავშალო ${m.name}-ის შეტყობინება?`}>წაშლა</ConfirmButton></form>
          </div>
        </li>)}
      </ol>}
    </main>
  </>;
}
