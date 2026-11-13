// Seeds the six placeholder projects the site shipped with (fictional names). Skips any slug that already exists.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const projects = [
  { slug: "mzeo", titleKa: "მზეო", titleEn: "Mzeo", summaryKa: "სივრცის ახალი იდენტობა", summaryEn: "A new identity for space", feelingKa: "თამამი", feelingEn: "bold", category: "identity", coverAspect: 1.35, toneA: "#d9d9d9", toneB: "#8a8a8a", year: 2026 },
  { slug: "kvali", titleKa: "კვალი", titleEn: "Kvali", summaryKa: "იდეების ციფრული სივრცე", summaryEn: "A digital space for ideas", feelingKa: "მკაფიო", feelingEn: "clear", category: "digital", coverAspect: 1.78, toneA: "#343434", toneB: "#080808", year: 2026 },
  { slug: "lile", titleKa: "ლილე", titleEn: "Lile", summaryKa: "ყოველდღიური კავშირები", summaryEn: "Everyday connections", feelingKa: "ცოცხალი", feelingEn: "alive", category: "digital", coverAspect: 1.63, toneA: "#b0b0b0", toneB: "#ececec", year: 2026 },
  { slug: "nisli", titleKa: "ნისლი", titleEn: "Nisli", summaryKa: "კულტურის ვიზუალური ენა", summaryEn: "A visual language for culture", feelingKa: "უნიკალური", feelingEn: "distinct", category: "identity", coverAspect: 1.7, toneA: "#0b0b0b", toneB: "#424242", year: 2025 },
  { slug: "zvirti", titleKa: "ზვირთი", titleEn: "Zvirti", summaryKa: "მარტივი ფორმების სისტემა", summaryEn: "A system of simple forms", feelingKa: "ძლიერი", feelingEn: "strong", category: "identity", coverAspect: 1.25, toneA: "#eeeeee", toneB: "#b5b5b5", year: 2025 },
  { slug: "karva", titleKa: "ქარვა", titleEn: "Karva", summaryKa: "მოძრაობა ახალი მიმართულებით", summaryEn: "Moving in a new direction", feelingKa: "თანამედროვე", feelingEn: "modern", category: "digital", coverAspect: 1.5, toneA: "#565656", toneB: "#161616", year: 2025 },
] as const;
for (const [i, p] of projects.entries()) {
  await db.project.upsert({ where: { slug: p.slug }, update: {}, create: { ...p, order: i + 1 } });
}
console.log(`seeded ${projects.length} projects`);
await db.$disconnect();
