import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { toFormValues } from "@/components/admin/toFormValues";
export default async function EditProject({ params }: PageProps<"/admin/projects/[id]">) {
  await requireAdmin();
  const project = await db.project.findUnique({ where: { id: (await params).id } });
  if (!project) notFound();
  return <><AdminHeader /><main className="admin-main">
    <h1>{project.titleKa}</h1>
    <ProjectForm initial={toFormValues(project)} />
  </main></>;
}
