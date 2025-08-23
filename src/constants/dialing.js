// Minimal dialing data for the countries in your country picker mock
export const DIAL_CODES = {
  AF: "+93",
  IR: "+98",
  TR: "+90",
  IN: "+91",
  SA: "+966",
  FR: "+33",
};

// Very light, UI-only heuristics to show a logo/name while typing.
// Tweak freely later; these are placeholders.
export const OPERATOR_PATTERNS = {
  AF: [
    { prefixes: ["070", "079"], name: "Roshan", color: "#E74C3C" },
    { prefixes: ["072", "078"], name: "AWCC", color: "#27AE60" },
    { prefixes: ["073", "077"], name: "Etisalat", color: "#2ECC71" },
    { prefixes: ["074", "076"], name: "MTN", color: "#F1C40F" },
  ],
  IN: [
    { prefixes: ["98", "97"], name: "Airtel", color: "#E53935" },
    { prefixes: ["99", "96"], name: "Jio", color: "#1565C0" },
  ],
  TR: [{ prefixes: ["53"], name: "Turkcell", color: "#F9A825" }],
  IR: [{ prefixes: ["91"], name: "MCI", color: "#1E88E5" }],
  SA: [{ prefixes: ["55"], name: "STC", color: "#8E24AA" }],
  FR: [{ prefixes: ["06", "07"], name: "Orange", color: "#F57C00" }],
};

export function guessOperator(cc, digits = "") {
  const d = String(digits).replace(/\D/g, "");
  // treat with and without leading 0 the same
  const v = d.startsWith("0") ? d.slice(1) : d; // local form (no 0)
  if (cc === "AF") {
    const p2 = v.slice(0, 2);
    // Demo mapping — adjust to your real tables when ready
    if (["70", "71"].includes(p2)) return { name: "AWCC", color: "#D32F2F" };
    if (["72", "73"].includes(p2))
      return { name: "Etisalat", color: "#2E7D32" };
    if (["74", "75"].includes(p2)) return { name: "MTN", color: "#F7A600" };
    if (["76", "77"].includes(p2)) return { name: "Roshan", color: "#C2185B" };
    if (["78", "79"].includes(p2)) return { name: "Salaam", color: "#1565C0" };
  }
  return null;
}
