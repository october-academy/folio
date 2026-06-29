// SPDX-License-Identifier: MIT
import { describe, expect, test } from "bun:test";
import { buildVCard, vcardDataUri, vcardFilename } from "./vcard";

describe("vCard generation", () => {
  test("builds a valid vCard 3.0 with the provided fields", () => {
    const vcf = buildVCard({
      name: "Hogyun Yu",
      org: "October Academy",
      role: "Founder",
      email: "hi@oct.com",
      phone: "+82 (10) 1234-5678",
      url: "https://oct.com/",
    });
    expect(vcf).toContain("BEGIN:VCARD");
    expect(vcf).toContain("VERSION:3.0");
    expect(vcf).toContain("FN:Hogyun Yu");
    expect(vcf).toContain("ORG:October Academy");
    expect(vcf).toContain("TITLE:Founder");
    expect(vcf).toContain("EMAIL;TYPE=INTERNET:hi@oct.com");
    // phone digits are normalized for the TEL value.
    expect(vcf).toContain("TEL;TYPE=CELL:+821012345678");
    expect(vcf).toContain("URL:https://oct.com/");
    expect(vcf.trimEnd().endsWith("END:VCARD")).toBe(true);
    expect(vcf).toContain("\r\n");
  });

  test("omits absent optional fields", () => {
    const vcf = buildVCard({ name: "Solo" });
    expect(vcf).toContain("FN:Solo");
    expect(vcf).not.toContain("ORG:");
    expect(vcf).not.toContain("EMAIL");
  });

  test("escapes special characters", () => {
    const vcf = buildVCard({ name: "Doe, John; Jr." });
    expect(vcf).toContain("FN:Doe\\, John\\; Jr.");
  });

  test("data URI + filename are well-formed", () => {
    const data = { name: "Hogyun Yu" };
    expect(vcardDataUri(data).startsWith("data:text/vcard;charset=utf-8,")).toBe(true);
    expect(vcardFilename(data)).toBe("hogyun-yu.vcf");
    expect(vcardFilename({ name: "!!!" })).toBe("contact.vcf");
  });
});
