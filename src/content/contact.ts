import type { Locale } from "./locales";
// Placeholder testimonials: the owner will replace them with real client quotes.
export type Testimonial = { quote: string; name: string; role: string };
type ContactCopy = {
  title: string; intro: string;
  name: string; namePh: string; email: string; emailPh: string; company: string; companyPh: string;
  message: string; messagePh: string; submit: string; subject: string;
  quotesLabel: string; testimonials: Testimonial[];
};
const copy: Record<Locale, ContactCopy> = {
  ka: {
    title: "დაგვიკავშირდი", intro: "მოგვწერე პროექტზე და მალე გიპასუხებთ.",
    name: "სახელი", namePh: "გიორგი ბერიძე", email: "ელფოსტა", emailPh: "giorgi@company.ge",
    company: "კომპანია", companyPh: "კომპანიის სახელი", message: "შეტყობინება", messagePh: "მოგვიყევი პროექტზე",
    submit: "გაგზავნა", subject: "ახალი პროექტი", quotesLabel: "კლიენტების შეფასებები",
    testimonials: [
      { quote: "პროცესი გამჭვირვალე იყო და შედეგი ყველა მოლოდინს გადააჭარბა.", name: "ნინო კ.", role: "მარკეტინგის ხელმძღვანელი" },
      { quote: "ბრენდის განახლების შემდეგ ჩვენი აუდიტორია ორჯერ გაიზარდა.", name: "დავით მ.", role: "დამფუძნებელი" },
      { quote: "გუნდი ყოველთვის ერთი ნაბიჯით წინ ფიქრობს. რეკომენდაციას ვუწევ.", name: "ანა გ.", role: "პროდუქტის მენეჯერი" },
      { quote: "იდეიდან გაშვებამდე ყველაფერი დროულად და ხარისხიანად გაკეთდა.", name: "ლევან ჩ.", role: "აღმასრულებელი დირექტორი" },
    ],
  },
  en: {
    title: "Contact us", intro: "Tell us about your project and we’ll get back to you soon.",
    name: "Full name", namePh: "Jane Doe", email: "Email address", emailPh: "jane@company.com",
    company: "Company", companyPh: "Company name", message: "Message", messagePh: "Tell us about your project",
    submit: "Submit", subject: "New project", quotesLabel: "Client testimonials",
    testimonials: [
      { quote: "The process was transparent and the result went beyond every expectation.", name: "Nino K.", role: "Head of Marketing" },
      { quote: "After the rebrand our audience doubled.", name: "David M.", role: "Founder" },
      { quote: "The team always thinks one step ahead. Highly recommended.", name: "Ana G.", role: "Product Manager" },
      { quote: "From idea to launch, everything shipped on time and to a high standard.", name: "Levan Ch.", role: "CEO" },
    ],
  },
};
export const contactCopy = (locale: Locale) => copy[locale];
