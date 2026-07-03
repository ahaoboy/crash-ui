export const REGION_OTHER = "__other__";
const FLAG_OFFSET = 0x1f1e6;
const A_CHARCODE = 0x41;

const ISO_CODES = new Set([
  "US",
  "JP",
  "SG",
  "HK",
  "TW",
  "KR",
  "DE",
  "GB",
  "FR",
  "NL",
  "CA",
  "AU",
  "RU",
  "IN",
  "BR",
  "IT",
  "ES",
  "CH",
  "SE",
  "TR",
  "VN",
  "TH",
  "MY",
  "PH",
  "ID",
  "AR",
  "MX",
  "ZA",
  "AE",
  "IE",
  "PL",
  "FI",
  "NO",
  "DK",
  "AT",
]);

function leadingFlagToCode(name: string): string | null {
  const cps = [...name];
  const first = cps[0]?.codePointAt(0) ?? 0;
  const second = cps[1]?.codePointAt(0) ?? 0;
  const inRange = (c: number) => c >= FLAG_OFFSET && c <= FLAG_OFFSET + 25;
  if (inRange(first) && inRange(second)) {
    return (
      String.fromCharCode(A_CHARCODE + (first - FLAG_OFFSET)) +
      String.fromCharCode(A_CHARCODE + (second - FLAG_OFFSET))
    );
  }
  return null;
}

export function codeToFlag(code: string): string {
  if (code.length !== 2) return "";
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(FLAG_OFFSET + (c.charCodeAt(0) - A_CHARCODE)))
    .join("");
}

export function parseNodeRegion(name: string): string | null {
  const flag = leadingFlagToCode(name);
  if (flag) return flag;
  const code = name.match(/^([A-Z]{2})[_\-\s]/i)?.[1]?.toUpperCase();
  return code && ISO_CODES.has(code) ? code : null;
}

export interface RegionFacet {
  code: string;
  flag: string;
  count: number;
}

export function getRegionFacets(names: string[]): RegionFacet[] {
  const counts = new Map<string, number>();
  for (const name of names) {
    const code = parseNodeRegion(name) ?? REGION_OTHER;
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([code, count]) => ({
      code,
      flag: code === REGION_OTHER ? "" : codeToFlag(code),
      count,
    }))
    .sort((a, b) => {
      if (a.code === REGION_OTHER) return 1;
      if (b.code === REGION_OTHER) return -1;
      return b.count - a.count || a.code.localeCompare(b.code);
    });
}

export function splitLeadingFlag(name: string): { flag: string; rest: string } {
  const re =
    /^(?:\p{Regional_Indicator}\p{Regional_Indicator}|\p{Extended_Pictographic}\uFE0F?)\s*/u;
  const matched = name.match(re)?.[0] ?? "";
  if (!matched) return { flag: "", rest: name };
  return {
    flag: matched.replace(/\s+$/u, ""),
    rest: name.slice(matched.length),
  };
}

export function encodeSvgForDataUri(svg: string): string {
  return svg
    .replace("<svg", svg.includes("xmlns") ? "<svg" : '<svg xmlns="http://www.w3.org/2000/svg"')
    .replace(/"/g, "'")
    .replace(/%/g, "%25")
    .replace(/#/g, "%23")
    .replace(/\{/g, "%7B")
    .replace(/\}/g, "%7D")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E");
}
