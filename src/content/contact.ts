import type { Locale } from "./locales";
type ContactCopy = {
  title: string; intro: string;
  name: string; namePh: string; email: string; emailPh: string; company: string; companyPh: string;
  message: string; messagePh: string; submit: string; sending: string;
  to: string; city: string; country: string; landed: string; sent: string; again: string;
  errors: { invalid: string; busy: string; failed: string };
};
const copy: Record<Locale, ContactCopy> = {
  ka: {
    title: "დაგვიკავშირდი", intro: "მოგვწერე პროექტზე და მალე გიპასუხებთ.",
    name: "სახელი", namePh: "გიორგი ბერიძე", email: "ელფოსტა", emailPh: "giorgi@company.ge",
    company: "კომპანია", companyPh: "კომპანიის სახელი", message: "შეტყობინება", messagePh: "მოგვიყევი პროექტზე…",
    submit: "გაგზავნა", sending: "იგზავნება…",
    to: "ვის", city: "თბილისი", country: "საქართველო", landed: "ჩავიდა თბილისში",
    sent: "მიღებულია. მალე გიპასუხებთ.", again: "ახალი წერილი",
    errors: { invalid: "შეავსე სახელი, სწორი ელფოსტა და შეტყობინება.", busy: "ცოტა ხანში სცადე თავიდან.", failed: "ვერ გაიგზავნა. სცადე თავიდან ან მოგვწერე ელფოსტაზე." },
  },
  en: {
    title: "Contact us", intro: "Tell us about your project and we’ll get back to you soon.",
    name: "Full name", namePh: "Jane Doe", email: "Email address", emailPh: "jane@company.com",
    company: "Company", companyPh: "Company name", message: "Message", messagePh: "Tell us about your project…",
    submit: "Send", sending: "Sending…",
    to: "To", city: "Tbilisi", country: "Georgia", landed: "Landed in Tbilisi",
    sent: "Received. We’ll get back to you soon.", again: "New message",
    errors: { invalid: "Add your name, a valid email and a message.", busy: "Please try again in a little while.", failed: "Couldn’t send. Try again or email us." },
  },
};
export const contactCopy = (locale: Locale) => copy[locale];
