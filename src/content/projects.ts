import type { Locale } from "./locales";
export type Localized = Record<Locale, string>;
export type CategoryId = "identity" | "digital";
export type Project = {
  slug: string; title: Localized; summary: Localized; category: CategoryId;
  cover: { kind: "gradient" | "image" | "video"; src?: string; poster?: string; aspect: number; tone: [string, string] };
  year: number; featured: boolean; order: number;
};
export type Category = { id: CategoryId; title: Localized; description: Localized; theme: "light" | "dark" };
// placeholder — fictional projects; replace this repository with Prisma queries later.
const projects: Project[] = [
  { slug: "forma", title: { ka: "ფორმა", en: "Forma" }, summary: { ka: "სივრცის ახალი იდენტობა", en: "A new identity for space" }, category: "identity", cover: { kind: "gradient", aspect: 1.35, tone: ["#d9d9d9", "#8a8a8a"] }, year: 2026, featured: true, order: 1 },
  { slug: "axis", title: { ka: "ღერძი", en: "Axis" }, summary: { ka: "იდეების ციფრული სივრცე", en: "A digital space for ideas" }, category: "digital", cover: { kind: "gradient", aspect: 1.78, tone: ["#343434", "#080808"] }, year: 2026, featured: true, order: 2 },
  { slug: "field", title: { ka: "ველი", en: "Field" }, summary: { ka: "ყოველდღიური კავშირები", en: "Everyday connections" }, category: "digital", cover: { kind: "gradient", aspect: 1.63, tone: ["#b0b0b0", "#ececec"] }, year: 2026, featured: true, order: 3 },
  { slug: "interval", title: { ka: "ინტერვალი", en: "Interval" }, summary: { ka: "კულტურის ვიზუალური ენა", en: "A visual language for culture" }, category: "identity", cover: { kind: "gradient", aspect: 1.7, tone: ["#0b0b0b", "#424242"] }, year: 2025, featured: true, order: 4 },
  { slug: "layer", title: { ka: "შრე", en: "Layer" }, summary: { ka: "მარტივი ფორმების სისტემა", en: "A system of simple forms" }, category: "identity", cover: { kind: "gradient", aspect: 1.25, tone: ["#eeeeee", "#b5b5b5"] }, year: 2025, featured: true, order: 5 },
  { slug: "route", title: { ka: "გეზი", en: "Route" }, summary: { ka: "მოძრაობა ახალი მიმართულებით", en: "Moving in a new direction" }, category: "digital", cover: { kind: "gradient", aspect: 1.5, tone: ["#565656", "#161616"] }, year: 2025, featured: false, order: 6 },
];
const categories: Category[] = [
  { id: "identity", title: { ka: "იდენტობა", en: "Identity" }, description: { ka: "ვქმნით ვიზუალურ ენას, რომელიც იდეას მკაფიო ფორმას აძლევს.", en: "Visual languages that give an idea a clear and distinctive form." }, theme: "light" },
  { id: "digital", title: { ka: "ციფრული", en: "Digital" }, description: { ka: "ვაკავშირებთ ადამიანებსა და იდეებს მარტივი ციფრული გამოცდილებით.", en: "Connecting people and ideas through considered digital experiences." }, theme: "dark" },
];
export async function getProjects(): Promise<Project[]> { return structuredClone(projects).sort((a, b) => a.order - b.order); }
export async function getFeaturedProjects() { return (await getProjects()).filter(p => p.featured); }
export async function getProject(slug: string) { return (await getProjects()).find(p => p.slug === slug); }
export async function getCategories(): Promise<Category[]> { return structuredClone(categories); }
export async function getProjectsByCategory(id: CategoryId) { return (await getProjects()).filter(p => p.category === id); }
