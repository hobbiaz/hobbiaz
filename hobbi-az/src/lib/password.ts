const WIDTHS = ["0%", "28%", "52%", "76%", "100%"];
const COLORS = ["#e0e0e0", "#ba1a1a", "#F06328", "#FCBC05", "#0DB0A0"];
const LABELS = ["", "Zəif", "Orta", "Güclü", "Çox güclü"];

/** 0–4 score: length ≥ 8, an uppercase letter, a digit, a symbol. */
export function passwordScore(value: string) {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score;
}

export function passwordStrength(value: string) {
  const score = passwordScore(value);
  return { score, width: WIDTHS[score], color: COLORS[score], label: LABELS[score] };
}
