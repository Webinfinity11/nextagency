import type { Locale } from "./locales";
// Static for now; later this can come from the admin panel. `tone` is the placeholder gradient until real photos exist.
export type Service = { title: string; items: string[]; tone: [string, string] };
type Copy = { label: string; services: Service[] };
const tones: [string, string][] = [["#d6d6d6", "#9a9a9a"], ["#3a3a3a", "#0e0e0e"], ["#ececec", "#bcbcbc"], ["#5c5c5c", "#1c1c1c"], ["#c4c4c4", "#7c7c7c"], ["#2a2a2a", "#050505"]];
const copy: Record<Locale, Copy> = {
  ka: {
    label: "ჩვენი სერვისები",
    services: [
      { title: "სტრატეგია", items: ["პლატფორმა", "პოზიციონირება", "ბრენდის არქიტექტურა", "დასახელება"] },
      { title: "ვერბალური იდენტობა", items: ["მესიჯების სისტემა", "ხმის ტონი", "სთორითელინგი", "ქოფირაითინგი"] },
      { title: "ვიზუალური იდენტობა", items: ["ლოგო და ნიშანი", "ტიპოგრაფია და ფერი", "ბრენდბუქი", "მოძრაობის ენა"] },
      { title: "ციფრული გამოცდილება", items: ["ვებსაიტები", "UX/UI დიზაინი", "დეველოპმენტი", "ციფრული პროდუქტები"] },
      { title: "ბაზარზე გასვლა", items: ["გაშვების კამპანია", "კონტენტი და სოციალური მედია", "კრეატიული მიმართულება"] },
      { title: "მომავლის ევოლუცია", items: ["ბრენდის განახლება", "AI ინტეგრაცია", "ექსპერიმენტული კონცეფციები"] },
    ].map((s, i) => ({ ...s, tone: tones[i] })),
  },
  en: {
    label: "Our services",
    services: [
      { title: "Strategy", items: ["Platform", "Positioning", "Brand Architecture", "Naming"] },
      { title: "Verbal Identity", items: ["Messaging Framework", "Tone of Voice", "Storytelling", "Copywriting"] },
      { title: "Visual Identity", items: ["Logo & Mark", "Typography & Colour", "Brand Guidelines", "Motion Language"] },
      { title: "Digital Experience", items: ["Websites", "UX/UI Design", "Development", "Digital Products"] },
      { title: "Go to Market", items: ["Launch Campaign", "Content & Social", "Creative Direction"] },
      { title: "Future Evolution", items: ["Brand Refresh", "AI Integration", "Exploratory Concepting"] },
    ].map((s, i) => ({ ...s, tone: tones[i] })),
  },
};
export const servicesCopy = (locale: Locale) => copy[locale];
