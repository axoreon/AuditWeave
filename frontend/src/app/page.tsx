"use client";

import { LightNavbar } from "./components/home-light/LightNavbar";
import { LightHero } from "./components/home-light/LightHero";
import { TheProblem } from "./components/home-light/TheProblem";
import { TheSolution } from "./components/home-light/TheSolution";
import { HowItWorks } from "./components/home-light/HowItWorks";
import { AxoreonProducts } from "./components/home-light/AxoreonProducts";
import { FAQ } from "./components/home-light/FAQ";
import { FinalCTA } from "./components/home-light/FinalCTA";
import { LightFooter } from "./components/home-light/LightFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <LightNavbar />
      <LightHero />
      <TheProblem />
      <TheSolution />
      <HowItWorks />
      <AxoreonProducts />
      <FAQ />
      <FinalCTA />
      <LightFooter />
    </div>
  );
}
