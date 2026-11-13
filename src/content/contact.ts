import type { Locale } from "./locales";
type ContactCopy = {
  title: string; intro: string;
  name: string; email: string; company: string;
  message: string; messagePh: string; submit: string; sending: string;
  landed: string; sent: string; airmail: string; where: string;
  errors: { invalid: string; busy: string; failed: string };
};
const copy: Record<Locale, ContactCopy> = {
  ka: {
    title: "დაგვიკავშირდი", intro: "მოგვწერე პროექტზე და მალე გიპასუხებთ.",
    name: "სახელი", email: "ელფოსტა",
    company: "კომპანია", message: "შეტყობინება", messagePh: "მოგვიყევი პროექტზე…",
    submit: "გაგზავნა", sending: "იგზავნება…",
    landed: "ჩავიდა თბილისში", airmail: "ავიაფოსტა", where: "სად ვართ",
    sent: "მიღებულია. მალე გიპასუხებთ.",
    errors: { invalid: "შეავსე სახელი, სწორი ელფოსტა და შეტყობინება.", busy: "ცოტა ხანში სცადე თავიდან.", failed: "ვერ გაიგზავნა. სცადე თავიდან ან მოგვწერე ელფოსტაზე." },
  },
  en: {
    title: "Contact us", intro: "Tell us about your project and we’ll get back to you soon.",
    name: "Full name", email: "Email address",
    company: "Company", message: "Message", messagePh: "Tell us about your project…",
    submit: "Send", sending: "Sending…",
    landed: "Landed in Tbilisi", airmail: "AIR MAIL", where: "Where we are",
    sent: "Received. We’ll get back to you soon.",
    errors: { invalid: "Add your name, a valid email and a message.", busy: "Please try again in a little while.", failed: "Couldn’t send. Try again or email us." },
  },
};
export const contactCopy = (locale: Locale) => copy[locale];
