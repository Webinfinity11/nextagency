import type { Locale } from "./locales";
// Services list and the /services page copy (taken from infinity.ge/services at the owner's request).
// `tone` is the placeholder gradient for the home section photo until real photos exist.
export type ServiceCategory = "tech" | "marketing" | "design";
export type Service = { category: ServiceCategory; title: string; description: string; tags: string[]; tone: [string, string] };
type QA = { title: string; text: string };
type Copy = {
  label: string; eyebrow: string; title: string; all: string; categories: Record<ServiceCategory, string>;
  services: Service[];
  cta: { title: string; text: string; button: string };
  guide: { title: string; items: QA[] };
  faq: { title: string; text: string; more: string; moreText: string; button: string; items: QA[] };
  start: { title: string; text: string; button: string };
};
const tones: [string, string][] = [["#d6d6d6", "#9a9a9a"], ["#3a3a3a", "#0e0e0e"], ["#ececec", "#bcbcbc"], ["#5c5c5c", "#1c1c1c"], ["#c4c4c4", "#7c7c7c"], ["#2a2a2a", "#050505"]];
const list = (items: Omit<Service, "tone">[]) => items.map((s, i) => ({ ...s, tone: tones[i % tones.length] }));
const copy: Record<Locale, Copy> = {
  ka: {
    label: "ჩვენი სერვისები",
    eyebrow: "NEXT AGENCY",
    title: "შენი ბიზნესის შემდეგი ეტაპი.",
    all: "ყველა",
    categories: { tech: "ტექნოლოგია", marketing: "მარკეტინგი", design: "დიზაინი" },
    services: list([
      { category: "tech", title: "საიტის დამზადება", description: "იდეიდან სწრაფ, გამართულ ვებსაიტამდე — თქვენი ბიზნესის საჭიროებებზე მორგებით.", tags: ["Next.js", "WordPress", "E-commerce"] },
      { category: "marketing", title: "სოციალური მედიის მართვა", description: "კონტენტი და კამპანიები, რომლებიც თქვენს ბრენდს სწორ აუდიტორიასთან აკავშირებს.", tags: ["Strategy", "Social", "Ads"] },
      { category: "marketing", title: "SEO ოპტიმიზაცია", description: "გახდით ხილული მაშინ, როცა მომხმარებელი თქვენს სერვისს ეძებს.", tags: ["Technical SEO", "Content", "Analytics"] },
      { category: "marketing", title: "ვიდეო გადაღება", description: "პროდუქტი, სივრცე და ადამიანები — თქვენი ამბავი კადრებში.", tags: ["Production", "Reels", "Drone"] },
      { category: "design", title: "ლოგოს შექმნა", description: "ვიზუალური იდენტობა, რომელსაც ამოიცნობენ და დაიმახსოვრებენ.", tags: ["Identity", "Logo", "Brandbook"] },
      { category: "design", title: "პრეზენტაციის აწყობა", description: "მკაფიო ამბავი და დამაჯერებელი ვიზუალი თქვენი იდეისთვის.", tags: ["Pitch deck", "Storytelling", "Design"] },
      { category: "tech", title: "საიტის ადმინისტრირება", description: "საიტის ყოველდღიური გამართულობა, უსაფრთხოება და განვითარება.", tags: ["Support", "Security", "Performance"] },
      { category: "marketing", title: "ინფლუენსერ მარკეტინგი", description: "თქვენი ბრენდის ამბავი — შესაბამისი ადამიანების ხმით.", tags: ["Creators", "Campaigns", "Reach"] },
      { category: "tech", title: "კორპორატიული მეილის შექმნა", description: "პროფესიონალური ელფოსტა თქვენი კომპანიის დომენზე.", tags: ["Google Workspace", "Microsoft 365"] },
      { category: "tech", title: "აპლიკაციის დამზადება", description: "ციფრული პროდუქტები და აპლიკაციები, რომლებიც რეალურ ამოცანებს წყვეტს.", tags: ["React", "MVP", "Web apps"] },
      { category: "tech", title: "CRM სისტემის დანერგვა", description: "მოაწესრიგეთ გაყიდვები, მომხმარებლები და ბიზნესპროცესები ერთ სისტემაში.", tags: ["CRM", "Automation", "PostgreSQL"] },
    ]),
    cta: { title: "იდეიდან რეალურ შედეგამდე", text: "გაიცანი ჩვენი შექმნილი ვებსაიტები, ბრენდები და ციფრული პროექტები.", button: "პროექტების ნახვა" },
    guide: {
      title: "რომელი სერვისი გჭირდებათ?",
      items: [
        { title: "ვებ-პრეზენცია და ტექნიკური საფუძველი", text: "საიტის დამზადება — სავიზიტო landing-იდან ონლაინ მაღაზიამდე, CMS-ზე ან custom კოდით, BOG-ის, TBC-სა და PayPal-ის გადახდებით და მრავალენოვნებით WPML-ის ან Polylang-ის საშუალებით. პროცესი კონსულტაციით იწყება და UI/UX დიზაინით, დეველოპმენტით, ტესტირებითა და გუნდის ტრენინგით სრულდება; ჩაბარებიდან 30 დღე ტექნიკური მხარდაჭერა უფასოა. თუ ბიზნეს პროცესს ცალკე პროდუქტი სჭირდება — აპლიკაციის დამზადება, მარტივი MVP-დან კომპლექსურ სისტემამდე, მობილური, ვები ან ორივე, App Store-სა და Google Play-ში განთავსებით. უკვე გაშვებულ საიტს კი სჭირდება ადმინისტრირება — WordPress-ის, თემისა და პლაგინების განახლებები, სარეზერვო ასლები, უსაფრთხოების მონიტორინგი, Core Web Vitals და WooCommerce-ის შემოწმება — და კორპორატიული მეილი Google Workspace-ზე, Microsoft 365-ზე ან Zoho-ზე, გამართული MX, SPF, DKIM და DMARC ჩანაწერებით და არსებული ფოსტიდან მიგრაციით." },
        { title: "ხილვადობა და ტრაფიკი", text: "SEO ოპტიმიზაცია უფასო აუდიტით იწყება და მოიცავს ტექნიკურ სამუშაოს, საკვანძო სიტყვების კვლევას, on-page და off-page ოპტიმიზაციას, საიტის სტრუქტურას, უკუბმულებს, ლოკალურ SEO-სა და ბლოგების მომზადებას. სოციალური მედიის მართვა — კონტენტის შექმნა და ფასიანი რეკლამის მართვა Facebook-ზე, Instagram-ზე, TikTok-სა და LinkedIn-ზე — პოსტები და მოკლე ვიდეოები (Reels), თვეში 2000 ლარიდან; თავად სარეკლამო ბიუჯეტი ცალკეა და პირდაპირ პლატფორმას უხდით. ინფლუენსერ მარკეტინგი კი ცნობადობას ცოცხალი რეკომენდაციით აშენებს: ვირჩევთ ინფლუენსერებს ნანოდან (1K-10K) მეგამდე (1M+), ვმართავთ მოლაპარაკებებს, ხელშეკრულებებსა და კამპანიას Instagram-ზე, TikTok-ზე, YouTube-ზე, Facebook-სა და LinkedIn-ზე." },
        { title: "ბრენდი და კონტენტი", text: "ლოგოს შექმნა — ახალი ლოგო, რებრენდინგი, სავიზიტო ბარათი ან სრული ბრენდბუქი — დაახლოებით ორ კვირას მოიცავს: პირველ კვირაში კონცეფციებს წარმოგიდგენთ, მეორეში არჩეულს ვხვეწთ; ჩაბარებისას იღებთ JPEG, PNG, SVG და ვექტორულ AI/EPS ფაილებს. ვიდეო გადაღება სამ ეტაპად მიმდინარეობს — Pre-production, გადაღება პროფესიონალური კამერითა და ხმის ჩაწერით, მონტაჟი ფერის კორექციით, მუსიკითა და გრაფიკით; საბაზისო ფასები 250-400 ლარიდან იწყება. პრეზენტაციის აწყობა კი დაახლოებით 10-15 სლაიდის საბაზისო დიზაინიდან პრემიუმ პაკეტამდე — სტრუქტურით, ბრენდირებული შაბლონით, კვლევით, ინფოგრაფიკითა და ანიმაციით." },
        { title: "გაყიდვები და პროცესები", text: "CRM სისტემის დანერგვა — ინდივიდუალურად აწყობილი სისტემა მზა SaaS-ის ნაცვლად: კლიენტების ბაზა, ლიდები, გაყიდვების pipeline, დავალებები, შეკვეთები, ანგარიშები და საჭირო ინტეგრაციები. დანერგვა ეტაპობრივია — კონსულტაციიდან და სტრუქტურის დაგეგმვიდან დიზაინამდე, დეველოპმენტამდე, ტესტირებამდე და მხარდაჭერამდე. განსაკუთრებით გამოსადეგია სერვისული, სამშენებლო-სარემონტო და სადისტრიბუციო კომპანიებისთვის, კლინიკებისთვის, სასწავლო ცენტრებისა და ონლაინ მაღაზიებისთვის." },
      ],
    },
    faq: {
      title: "ხშირად დასმული კითხვები", text: "პასუხები კითხვებზე, რომლებსაც ყველაზე ხშირად გვისვამენ.",
      more: "ვერ იპოვე პასუხი?", moreText: "მოგვწერე — უფასო კონსულტაციაზე ყველაფერს განვიხილავთ.", button: "უფასო კონსულტაცია",
      items: [
        { title: "რა ღირს საიტის დამზადება?", text: "მარტივი ერთგვერდიანი ლენდინგის ფასი 500 ₾-ია, წინასწარ განსაზღვრული მოცულობით. სხვა საიტების, ონლაინ მაღაზიებისა და CRM სისტემების ღირებულება ინდივიდუალურად განისაზღვრება - დიზაინის, ფუნქციების, ენებისა და ინტეგრაციების მიხედვით." },
        { title: "რამდენ ხანში მზადდება საიტი?", text: "მარტივი ერთგვერდიანი ლენდინგის გაკეთება შეგვიძლია 500 ლარად, 3 დღეში. შეთავაზება მოიცავს ერთ ენას, მზა სტრუქტურის ბრენდზე მორგებას, საკონტაქტო ფორმასა და მობილურ ვერსიას. ვადა იწყება ტექსტების, ფოტოების სრულად მიღებისა და მოცულობის დამტკიცების შემდეგ. ინდივიდუალური დიზაინი, დამატებითი გვერდები, გადახდები და CRM ამ შეთავაზებაში არ შედის; დომენისა და ჰოსტინგის პირობები დაწყებამდე ზუსტდება." },
        { title: "რამდენ ხანში ჩანს SEO ოპტიმიზაციის შედეგი?", text: "ერთი ვადა არ არსებობს — საშუალოდ 1 კვირიდან 6 თვემდე, შესასრულებელი სამუშაოს მოცულობის მიხედვით. სამუშაო უფასო SEO აუდიტით იწყება, რომელიც აჩვენებს, კონკრეტულად რა უშლის ხელს საიტს დაწინაურებაში." },
        { title: "სარეკლამო ბიუჯეტი შედის სოციალური მედიის მართვის ფასში?", text: "არა. მომსახურების ღირებულება მოიცავს კონტენტის შექმნას, განთავსებასა და კამპანიების მართვას. თანხა, რომელსაც უშუალოდ რეკლამაში დახარჯავთ, ცალკე ბიუჯეტია და პირდაპირ პლატფორმას უხდით." },
        { title: "რით სჯობს დამოუკიდებელი CRM მზა სისტემის ქირაობას?", text: "მზა პროგრამის შემთხვევაში ბიზნესი სხვისი ლოგიკის მიხედვით ეწყობა და მომწოდებელზე ხდება დამოკიდებული. ჩვენ CRM-ს თქვენს პროცესებზე ვაწყობთ — ლიდების მართვა, pipeline, დავალებები, ანგარიშები და ინტეგრაციები." },
        { title: "მივიღებ თუ არა ლოგოს სამუშაო ფაილებს?", text: "დიახ. ჩაბარებისას იღებთ როგორც JPEG და PNG ფორმატებს, ისე ვექტორულ სამუშაო ფაილებს — SVG, AI და EPS. ვექტორი საშუალებას გაძლევთ, ლოგო ნებისმიერ ზომაზე გამოიყენოთ ხარისხის დაკარგვის გარეშე." },
        { title: "ვინ უვლის საიტს გაშვების შემდეგ?", text: "ჩაბარებიდან 30 დღის განმავლობაში ტექნიკური მხარდაჭერა უფასოა. შემდეგ შეგიძლიათ ადმინისტრირების პაკეტით ისარგებლოთ — განახლებები, სარეზერვო ასლები, უსაფრთხოების მონიტორინგი და სისწრაფის ოპტიმიზაცია." },
      ],
    },
    start: { title: "საიდან დავიწყოთ?", text: "მოგვწერეთ, გაგვიზიარეთ თქვენი ამოცანა და უფასო კონსულტაციაზე ერთად განვსაზღვრავთ, რომელი ნაბიჯი მოგცემთ ყველაზე დიდ ეფექტს.", button: "დაგვიკავშირდით" },
  },
  en: {
    label: "Our services",
    eyebrow: "NEXT AGENCY",
    title: "Your next chapter.",
    all: "All",
    categories: { tech: "Technology", marketing: "Marketing", design: "Design" },
    services: list([
      { category: "tech", title: "Website creation", description: "From an idea to a fast, reliable website tailored to your business.", tags: ["Next.js", "WordPress", "E-commerce"] },
      { category: "marketing", title: "Social media management", description: "Content and campaigns that connect your brand with the right audience.", tags: ["Strategy", "Social", "Ads"] },
      { category: "marketing", title: "SEO optimization", description: "Be visible when customers search for what you offer.", tags: ["Technical SEO", "Content", "Analytics"] },
      { category: "marketing", title: "Video shooting", description: "Products, spaces and people — your story in motion.", tags: ["Production", "Reels", "Drone"] },
      { category: "design", title: "Logo creation", description: "A visual identity people recognise and remember.", tags: ["Identity", "Logo", "Brandbook"] },
      { category: "design", title: "Presentation creation", description: "A clear story and compelling visuals for your idea.", tags: ["Pitch deck", "Storytelling", "Design"] },
      { category: "tech", title: "Website Maintenance", description: "Ongoing website maintenance, security and improvements.", tags: ["Support", "Security", "Performance"] },
      { category: "marketing", title: "Influencer Marketing", description: "Your brand story, told by the right creators.", tags: ["Creators", "Campaigns", "Reach"] },
      { category: "tech", title: "Corporate Email Setup", description: "Professional email on your company domain.", tags: ["Google Workspace", "Microsoft 365"] },
      { category: "tech", title: "App Development", description: "Digital products and applications that solve real problems.", tags: ["React", "MVP", "Web apps"] },
      { category: "tech", title: "CRM System Implementation", description: "Bring sales, customers and business processes into one system.", tags: ["CRM", "Automation", "PostgreSQL"] },
    ]),
    cta: { title: "From idea to reality.", text: "Explore our websites, brands and digital projects.", button: "View projects" },
    guide: {
      title: "Which service do you need?",
      items: [
        { title: "The foundation", text: "Website development covers landing pages, corporate sites and online stores, built on a CMS or in custom code, with BOG, TBC and PayPal payments and Georgian/English versions via WPML or Polylang; every project includes 30 days of free technical support after handover. When a business process needs its own product, app development runs from a simple MVP to a complex system — mobile, web or both, including App Store and Google Play publishing. A site that is already live needs website maintenance — updates, backups, security monitoring and speed — and corporate email on Google Workspace, Microsoft 365 or Zoho, with MX, SPF, DKIM and DMARC configured properly and migration from your existing mail." },
        { title: "Getting found", text: "SEO optimization starts with a free audit and covers the technical work, keyword research, on-page and off-page optimization, site structure and link building. Social media management handles content and paid campaigns on Facebook, Instagram, TikTok and LinkedIn — the advertising budget itself stays separate and is paid directly to the platform. Influencer marketing builds awareness through a recommendation rather than a banner: selecting creators from nano (1K-10K) to mega (1M+), handling negotiation and contracts, and running the campaign on Instagram, TikTok, YouTube, Facebook and LinkedIn." },
        { title: "Brand and content", text: "Logo design takes about two weeks — concepts in the first, refinement in the second — and you receive JPEG, PNG, SVG and the editable AI/EPS vectors. Video production runs through pre-production, shooting with sound, and post-production with editing, colour and graphics. Presentation design goes from a basic redesign of roughly 10-15 slides to a premium deck with structure, a branded template, research, infographics and animation." },
        { title: "Sales and systems", text: "CRM implementation builds a system around how your business actually works instead of renting an off-the-shelf product: customer database, leads, sales pipeline, tasks, orders, reporting and the integrations you need. Delivery is step by step, from consultation and structure planning through design, development, testing and ongoing support — and it suits service businesses, construction and repair firms, distributors, clinics, training centres and online stores in particular." },
      ],
    },
    faq: {
      title: "Frequently asked questions", text: "Answers to the questions we hear most often.",
      more: "Didn't find your answer?", moreText: "Write to us — we'll cover everything in a free consultation.", button: "Free Consultation",
      items: [
        { title: "Do you work with companies based outside Georgia?", text: "Yes. We have been operating in both the Georgian and international markets since 2015, and our work includes international brands such as TEKA, SYNEVO, EA7 and New Balance." },
        { title: "Can you build a site in Georgian and English at the same time?", text: "Yes. Multilingual websites are built with WPML or Polylang, so both language versions live in one system and one admin panel — an English version for partners and head office, a Georgian version for customers." },
        { title: "How long does a website take?", text: "Two to six weeks on average, depending on complexity. The exact timeline is set after the consultation, once the number of pages, the design requirements, the languages and any additional features are known." },
        { title: "What happens after the site launches?", text: "Every website project includes 30 days of free technical support after handover, and we run a training session for your team so content updates can be done in-house. Beyond that, website maintenance is available as a monthly service." },
        { title: "Is the advertising budget included in the social media price?", text: "No. The monthly package covers strategy, content production, publishing and campaign management. The money spent on the ads themselves is a separate budget that stays under your control and is paid directly to the platform." },
        { title: "Do I have to buy several services together?", text: "No. Each service works on its own, and there is no requirement to buy more than one. The advantage of combining them is practical: the site, its search structure and the content that runs on it are planned against the same brief." },
        { title: "How do prices work?", text: "It depends on the service. Website development, SEO, social media, video, presentations and app development publish package tiers and starting figures on their own pages. For CRM, logo design, website maintenance, corporate email and influencer marketing the price is quoted after a consultation, because it depends entirely on scope. Monthly services such as SEO and social media are billed per month; websites, logos, video and presentations are project-based." },
      ],
    },
    start: { title: "Where should you start?", text: "Tell us what you are trying to do and we will come back with a written scope, a timeline and a price for that scope. The consultation is free — write to us.", button: "Get in touch" },
  },
};
export const servicesCopy = (locale: Locale) => copy[locale];
