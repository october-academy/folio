// SPDX-License-Identifier: MIT
/**
 * QR matrix + SVG-path generation for the `qr` block, built on the MIT
 * `qrcode-generator` library (vendored via npm; credited in NOTICE). Pure +
 * isomorphic so it runs at SSR time on Cloudflare and is unit-testable.
 */
import qrcode from "qrcode-generator";

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

/** Encode `target` into a square boolean matrix of dark modules. */
export function qrModules(target: string, ec: ErrorCorrectionLevel = "M"): boolean[][] {
  const qr = qrcode(0, ec); // type 0 = auto-select the smallest fitting version
  qr.addData(target, "Byte"); // Byte mode — correct for URLs / arbitrary text
  qr.make();
  const n = qr.getModuleCount();
  const rows: boolean[][] = [];
  for (let r = 0; r < n; r++) {
    const row: boolean[] = new Array(n);
    for (let c = 0; c < n; c++) row[c] = qr.isDark(r, c);
    rows.push(row);
  }
  return rows;
}

/** An SVG path `d` covering every dark module as a 1×1 unit square. */
export function qrSvgPath(modules: boolean[][]): string {
  let d = "";
  for (let r = 0; r < modules.length; r++) {
    const row = modules[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      if (row[c]) d += `M${c} ${r}h1v1h-1z`;
    }
  }
  return d;
}
