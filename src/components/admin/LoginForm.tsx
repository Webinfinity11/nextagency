"use client";
import { useActionState } from "react";
import { login } from "@/app/admin/actions";
export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return <form action={action} className="admin-card admin-login-form">
    <h1>KAI STUDIO</h1>
    <p className="admin-muted">ადმინ პანელი</p>
    <label>ელფოსტა<input name="email" type="email" autoComplete="username" required autoFocus={!state?.email} defaultValue={state?.email} /></label>
    <label>პაროლი<input name="password" type="password" autoComplete="current-password" required autoFocus={!!state?.email} /></label>
    {state?.error && <p className="admin-error" role="alert">{state.error}</p>}
    <button className="admin-btn admin-btn-primary" disabled={pending}>{pending ? "შესვლა…" : "შესვლა"}</button>
  </form>;
}
