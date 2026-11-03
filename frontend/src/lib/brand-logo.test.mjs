import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appUrl = new URL("../app/", import.meta.url);
const targetFiles = [
  "layout.tsx",
  "components/PublicNavbar.tsx",
  "components/PublicFooter.tsx",
  "components/AuthSidebar.tsx",
  "login/page.tsx",
  "register/page.tsx",
  "forgot-password/page.tsx",
  "reset-password/page.tsx",
  "verify-email/page.tsx",
  "not-found.tsx",
];

test("active AuditWeave branding uses the centralized canonical logo", () => {
  const brandLogo = readFileSync(new URL("components/BrandLogo.tsx", appUrl), "utf8");
  assert.match(brandLogo, /AUDITWEAVE_LOGO_SRC = "\/auditweave-logo\.jpeg"/);

  for (const file of targetFiles) {
    const source = readFileSync(new URL(file, appUrl), "utf8");
    assert.equal(source.includes("axoreon-logo.png"), false, file);
    assert.equal(source.includes("axoreon-logo-square.png"), false, file);
    assert.equal(source.includes("<BrandLogo"), true, file);
  }
});

test("Powered by Axoreon text remains in shared brand surfaces", () => {
  for (const file of [
    "layout.tsx",
    "components/PublicNavbar.tsx",
    "components/PublicFooter.tsx",
    "components/AuthSidebar.tsx",
  ]) {
    const source = readFileSync(new URL(file, appUrl), "utf8").toLowerCase();
    assert.equal(source.includes("powered by axoreon"), true, file);
  }
});
