// Imports the agency's web projects from a folder of image folders (one per project, e.g. "JOBX_WebP_Images"
// with "JOBX_Feature.webp" + numbered page screenshots "01_JOBX_Home.webp" …).
//   pnpm db:import-projects "/path/to/folder" [--replace]
// The feature image becomes the cover; screenshots become the page blocks (first full width, then pairs).
// Projects are upserted by slug, so re-running updates them. --replace first deletes every project not in this list.
// Texts are first drafts written from the screenshots; edit them in /admin.
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

if (existsSync(".env")) process.loadEnvFile(".env");
const [dir, flag] = process.argv.slice(2);
if (!dir || !existsSync(dir)) { console.error("usage: pnpm db:import-projects <folder> [--replace]"); process.exit(1); }
const uploadRoot = path.resolve(process.env.UPLOAD_DIR || "./uploads");

type Entry = {
  folder: string; slug: string; titleKa: string; titleEn: string;
  summaryKa: string; summaryEn: string; headlineKa: string; headlineEn: string; introKa: string; introEn: string; accent: string;
};
const P: Entry[] = [
  { folder: "JOBX_WebP_Images", slug: "jobx", titleKa: "JOBX", titleEn: "JOBX", accent: "#0034e6",
    summaryKa: "ვაკანსიების პლატფორმა", summaryEn: "A job platform",
    headlineKa: "ვაკანსიების პლატფორმა საქართველოსთვის", headlineEn: "A job platform for Georgia",
    introKa: "JOBX ერთ სივრცეში აერთიანებს ვაკანსიებს, კომპანიებსა და კანდიდატებს.\nსაიტზეა ძიება ქალაქისა და ანაზღაურების ფილტრებით, ვაკანსიების Swipe რეჟიმი, CV-ის შემქმნელი და ცალკე გვერდი ბიზნესისთვის. ყველაფერი ერთნაირად მუშაობს კომპიუტერზე და ტელეფონზე.",
    introEn: "JOBX brings vacancies, companies and candidates into one place.\nSearch with city and salary filters, a swipe mode for vacancies, a CV builder and a dedicated space for businesses, on desktop and mobile alike." },
  { folder: "BorjomiPalace_WebP_Images", slug: "borjomi-palace", titleKa: "ბორჯომი პალასი", titleEn: "Borjomi Palace", accent: "#a77846",
    summaryKa: "სასტუმრო და სპა ცენტრი", summaryEn: "Hotel and spa centre",
    headlineKa: "ვებსაიტი სასტუმროსა და სპა ცენტრისთვის", headlineEn: "A website for a hotel and spa centre",
    introKa: "Borjomi Palace Health & Spa Center-ის საიტი სტუმარს ნომრებს, სპასა და რესტორანს აცნობს.\nჯავშნის ფორმა პირველივე ეკრანზეა, ამიტომ თარიღისა და სტუმრების არჩევა ერთ ნაბიჯში ხდება.",
    introEn: "The Borjomi Palace Health & Spa Center website introduces its rooms, spa and restaurant.\nThe booking form sits on the very first screen, so choosing dates and guests takes a single step." },
  { folder: "Teka_WebP_Images", slug: "teka", titleKa: "Teka", titleEn: "Teka", accent: "#af022a",
    summaryKa: "სამზარეულოს ტექნიკის კატალოგი", summaryEn: "Kitchen appliance catalogue",
    headlineKa: "საიტი სამზარეულოსა და აბაზანის ტექნიკისთვის", headlineEn: "A website for kitchen and bathroom appliances",
    introKa: "Teka-ს საიტზე თავმოყრილია სამზარეულოს ტექნიკის კატალოგი, SteakMaster-ისა და Infinity-ის სერიების გვერდები და აბაზანის კოლექცია.\nმუქი, პრემიუმ ვიზუალი ტექნიკას წინა პლანზე აყენებს.",
    introEn: "The Teka website brings together the kitchen appliance catalogue, pages for the SteakMaster and Infinity series and the bathroom collection.\nA dark, premium look keeps the products in front." },
  { folder: "Paradisi_WebP_Images", slug: "paradisi", titleKa: "Paradisi", titleEn: "Paradisi", accent: "#8e131d",
    summaryKa: "ფეხსაცმლისა და ტანსაცმლის ონლაინ მაღაზია", summaryEn: "Footwear and apparel online store",
    headlineKa: "ონლაინ მაღაზია ფეხსაცმლისა და ტანსაცმლისთვის", headlineEn: "An online store for footwear and apparel",
    introKa: "Paradisi-ს ონლაინ მაღაზია: კატალოგი დეტალური ფილტრებით, პროდუქტის გვერდი, New Balance-ის ბრენდის გვერდი და მაღაზიების მისამართები.\nაქციები და კოლექციები პირველივე ეკრანზე ჩანს.",
    introEn: "The Paradisi online store: a catalogue with detailed filters, product pages, a New Balance brand page and store locations.\nPromotions and collections are visible from the first screen." },
  { folder: "AgroMotors_WebP_Images", slug: "agromotors", titleKa: "აგრომოტორსი", titleEn: "AgroMotors", accent: "#044329",
    summaryKa: "სასოფლო-სამეურნეო ტექნიკა", summaryEn: "Agricultural machinery",
    headlineKa: "საიტი სასოფლო-სამეურნეო ტექნიკის კომპანიისთვის", headlineEn: "A website for an agricultural machinery company",
    introKa: "აგრომოტორსის საიტი ფერმერებს ტექნიკის კატალოგს სთავაზობს: ტრაქტორებს, კომბაინებს და აგრეგატებს.\nმოდელს, მაგალითად John Deere S7 700-ს, დეტალური გვერდი აქვს. ცალკეა სერვისისა და კომპანიის გვერდები.",
    introEn: "The AgroMotors website gives farmers a catalogue of tractors, combines and implements.\nEach model, such as the John Deere S7 700, has a detailed page, with separate service and company pages." },
  { folder: "Coridoor_WebP_Images", slug: "coridoor", titleKa: "კორიდორი", titleEn: "Coridoor", accent: "#044541",
    summaryKa: "პრემიუმ კარები და სივრცის მოწყობა", summaryEn: "Premium doors and interiors",
    headlineKa: "საიტი პრემიუმ კარებისა და სივრცის კონცეპტ მოლისთვის", headlineEn: "A website for a premium doors and interiors concept store",
    introKa: "კორიდორი პრემიუმ კარებისა და სივრცის მოწყობის კონცეპტ მოლია.\nსაიტზეა კარების კატალოგი, პროდუქტის გვერდი, მოწყობილი სივრცეების მაგალითები და სერვისები.",
    introEn: "Coridoor is a concept store for premium doors and interior finishing.\nThe website holds the door catalogue, product pages, finished spaces and services." },
  { folder: "ArtAcademy_WebP_Images", slug: "art-academy", titleKa: "სამხატვრო აკადემია", titleEn: "Tbilisi State Academy of Arts", accent: "#221f23",
    summaryKa: "თბილისის სახელმწიფო სამხატვრო აკადემია", summaryEn: "Tbilisi State Academy of Arts",
    headlineKa: "ვებსაიტი თბილისის სახელმწიფო სამხატვრო აკადემიისთვის", headlineEn: "A website for the Tbilisi State Academy of Arts",
    introKa: "თბილისის აპოლონ ქუთათელაძის სახელობის სახელმწიფო სამხატვრო აკადემიის საიტი.\nმკაცრი შავ-თეთრი ენა აკადემიის ისტორიასა და ხელოვნებას უთმობს ადგილს. საიტზეა ფაკულტეტები, სარკის დარბაზის გალერეა და სიახლეები.",
    introEn: "The website of the Apollon Kutateladze Tbilisi State Academy of Arts.\nA strict black-and-white language leaves room for the academy's history and art: faculties, the Mirror Hall gallery and news." },
  { folder: "FindFuture_WebP_Images", slug: "find-future", titleKa: "Find Future", titleEn: "Find Future", accent: "#e8461f",
    summaryKa: "სემინარები მომავლის დასაგეგმად", summaryEn: "Seminars for planning your future",
    headlineKa: "საიტი საგანმანათლებლო სემინარებისთვის", headlineEn: "A website for educational seminars",
    introKa: "Find Future სტუდენტებს მომავლის დაგეგმვაში ეხმარება.\nსაიტზე ჩანს სემინარები, მარტივი რეგისტრაცია და ის, თუ როგორ მუშაობს პროცესი.",
    introEn: "Find Future helps students plan what comes next.\nThe website shows the seminars, a simple registration and how the process works." },
  { folder: "MC_Direct_Solutions_WebP", slug: "mc-direct", titleKa: "MC Direct", titleEn: "MC Direct", accent: "#0091fd",
    summaryKa: "სატრანსპორტო კომპანიების ყიდვა-გაყიდვა აშშ-ში", summaryEn: "US motor carrier authority sales",
    headlineKa: "საიტი აშშ-ის სატრანსპორტო ლიცენზიების ბაზრისთვის", headlineEn: "A website for US motor carrier authority sales",
    introKa: "MC Direct აშშ-ში სატრანსპორტო კომპანიების (MC authority) ყიდვა-გაყიდვას აწყობს.\nსაიტზეა ყიდვისა და გაყიდვის გვერდები, კომპანიის შეფასება, Amazon Relay-ის გვერდი, პროცესის აღწერა და საკონტაქტო ფორმა.",
    introEn: "MC Direct brokers the purchase and sale of US motor carrier authorities.\nThe website covers buying and selling, company valuation, Amazon Relay, the process and a contact form." },
  { folder: "Mevile_WebP_Images", slug: "mevile", titleKa: "Mevile", titleEn: "Mevile", accent: "#22201f",
    summaryKa: "თანამედროვე მოდის ონლაინ მაღაზია", summaryEn: "Modern fashion online store",
    headlineKa: "ონლაინ მაღაზია თანამედროვე მოდის ბრენდისთვის", headlineEn: "An online store for a modern fashion brand",
    introKa: "Mevile Store თანამედროვე მოდის ბრენდია.\nმინიმალისტური საიტი პროდუქტსა და ფოტოგრაფიას ტოვებს წინა პლანზე.",
    introEn: "Mevile Store is a modern fashion brand.\nA minimal website keeps the product and the photography in front." },
  { folder: "GNG_Inner_WebP_Images", slug: "gng-inner", titleKa: "GNG Inner", titleEn: "GNG Inner", accent: "#3e3632",
    summaryKa: "ავეჯი და ინტერიერი", summaryEn: "Furniture and interiors",
    headlineKa: "საიტი ავეჯისა და ინტერიერის კომპანიისთვის", headlineEn: "A website for a furniture and interiors company",
    introKa: "GNG ავეჯს ქმნის კონკრეტული სივრცისთვის.\nსაიტზეა შესრულებული პროექტები, პროექტის გალერეა, სერვისები და კომპანიის ისტორია, რომელიც 2015 წლიდან იწყება.",
    introEn: "GNG makes furniture for a specific space.\nThe website shows completed projects, a project gallery, services and the company story, which starts in 2015." },
  { folder: "Lilat_Flowers_WebP_Images", slug: "lilat-flowers", titleKa: "Lilat Flowers", titleEn: "Lilat Flowers", accent: "#535f35",
    summaryKa: "ყვავილების ონლაინ მაღაზია", summaryEn: "Online flower shop",
    headlineKa: "ონლაინ მაღაზია ყვავილების სახლისთვის", headlineEn: "An online store for a flower house",
    introKa: "Lilat Flowers-ის საიტზე თაიგულებს ონლაინ ირჩევ და თბილისში მიტანას შეუკვეთავ.\nსაიტზეა კატეგორიები, პროდუქტის გვერდი, საკუთარი თაიგულის კონსტრუქტორი და ფლორისტიკის კურსი.",
    introEn: "On the Lilat Flowers website you choose bouquets online and order delivery across Tbilisi.\nIt has categories, product pages, a build-your-own bouquet tool and a floristry course." },
  { folder: "Materiel_WebP_Images", slug: "materiel", titleKa: "Materiel", titleEn: "Materiel", accent: "#1d2024",
    summaryKa: "მოდის ბრენდის ონლაინ მაღაზია", summaryEn: "Fashion brand online store",
    headlineKa: "ონლაინ მაღაზია მოდის ბრენდისთვის", headlineEn: "An online store for a fashion brand",
    introKa: "Materiel თანამედროვე ტანსაცმლის ბრენდია.\nსაიტზეა მაღაზია, პროდუქტის გვერდი, კოლექციები და ბრენდის საწარმოო გვერდი. დიდი ფოტოგრაფია ტანსაცმელს წინა პლანზე აყენებს.",
    introEn: "Materiel is a contemporary clothing brand.\nThe website has the shop, product pages, collections and a brand production page, with large photography keeping the clothes in front." },
];

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const month = new Date().toISOString().slice(0, 7);
mkdirSync(path.join(uploadRoot, month), { recursive: true });
/** Width and height from a WebP header (VP8X, VP8 or VP8L). */
function webpSize(file: string): [number, number] {
  const b = readFileSync(file).subarray(0, 40), chunk = b.toString("ascii", 12, 16);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") throw new Error(`${file}: not a WebP`);
  if (chunk === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (chunk === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (chunk === "VP8L") { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; }
  throw new Error(`${file}: unknown WebP chunk ${chunk}`);
}
/** Copies one image into UPLOAD_DIR under a random name and returns its URL and aspect ratio. */
function upload(file: string) {
  const name = `${randomBytes(12).toString("hex")}${path.extname(file).toLowerCase()}`;
  copyFileSync(file, path.join(uploadRoot, month, name));
  const [w, h] = webpSize(file);
  return { url: `/media/${month}/${name}`, aspect: Math.round((w / h) * 1000) / 1000 };
}

if (flag === "--replace") {
  const { count } = await db.project.deleteMany({ where: { slug: { notIn: P.map(p => p.slug) } } });
  console.log(`removed ${count} other projects`);
}
for (const [i, p] of P.entries()) {
  const folder = path.join(dir, p.folder);
  if (!existsSync(folder)) continue; // only the projects present in this folder are imported
  const files = readdirSync(folder).filter(f => f.endsWith(".webp")).sort();
  const feature = files.find(f => /_Feature\.webp$/.test(f));
  if (!feature) { console.warn(`skip ${p.folder}: no feature image`); continue; }
  const cover = upload(path.join(folder, feature));
  const pages = files.filter(f => f !== feature).map(f => upload(path.join(folder, f)));
  // First screenshot full width, the rest side by side; an odd one out at the end goes full width.
  const blocks = pages.map((m, k) => ({ kind: "image", src: m.url, aspect: m.aspect, wide: k === 0 || (k === pages.length - 1 && (pages.length - 1) % 2 === 1) }));
  const { folder: _, ...text } = p;
  const data = {
    ...text, category: "digital" as const, year: 2026, order: i + 1, published: true,
    tagsKa: ["ვებ დეველოპმენტი"], tagsEn: ["Web Development"], servicesKa: "ვებ დიზაინი, დეველოპმენტი", servicesEn: "Web design, development",
    coverKind: "image" as const, coverSrc: cover.url, coverPoster: null, coverAspect: cover.aspect, blocks,
  };
  await db.project.upsert({ where: { slug: p.slug }, update: data, create: data });
  console.log(`${p.slug}: cover + ${pages.length} pages`);
}
await db.$disconnect();
