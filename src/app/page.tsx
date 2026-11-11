import { Loader } from "@/components/loader/Loader";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/hero/Hero";
import { copy } from "@/content/hero";
export default function Home() {
  return (
    <div id="top">
      <a className="skip-link" href="#main">
        {copy.skip}
      </a>
      <SmoothScroll />
      <Nav />
      <main id="main">
        <Hero />
      </main>
      <Loader />
    </div>
  );
}
