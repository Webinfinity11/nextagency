import { requireAdmin } from "@/lib/admin-auth";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ProjectForm } from "@/components/admin/ProjectForm";
export default async function NewProject() {
  await requireAdmin();
  return <><AdminHeader /><main className="admin-main">
    <h1>ახალი პროექტი</h1>
    <ProjectForm initial={{ slug: "", titleKa: "", titleEn: "", summaryKa: "", summaryEn: "", feelingKa: "", feelingEn: "", introKa: "", introEn: "", category: "identity", year: new Date().getFullYear(), published: true, coverSrc: "", coverPoster: "", coverAspect: 1.5, toneA: "#d9d9d9", toneB: "#8a8a8a", blocks: [] }} />
  </main></>;
}
