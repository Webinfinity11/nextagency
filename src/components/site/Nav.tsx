import { Logo } from "@/components/brand/Logo";
import { copy } from "@/content/hero";
export function Nav() {
  return (
    <header className="nav">
      <a className="nav-brand" href="#top" aria-label={copy.home}>
        <Logo className="nav-logo" />
      </a>
      <nav className="nav-links" aria-label={copy.navLabel}>
        {copy.nav.map((label) => (
          <a key={label} href="#next">
            {label}
          </a>
        ))}
      </nav>
      <a className="nav-cta" href="#contact">
        {copy.cta}
        <span aria-hidden="true">↗</span>
      </a>
    </header>
  );
}
