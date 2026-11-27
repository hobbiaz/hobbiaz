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

/** Same rules as the server's registerSchema: 8+ chars, a letter and a digit. */
export function passwordProblem(value: string): string | null {
  if (value.length < 8) return "Şifrə ən azı 8 simvol olmalıdır";
  if (value.length > 128) return "Şifrə çox uzundur";
  if (!/[A-Za-z]/.test(value)) return "Şifrədə hərf olmalıdır";
  if (!/[0-9]/.test(value)) return "Şifrədə rəqəm olmalıdır";
  return null;
}

/** Azerbaijani mobile number without the +994 prefix: 9 digits, e.g. "50 123 45 67". */
export const isAzPhone = (value: string) => /^(10|50|51|55|60|70|77|99)\d{7}$/.test(value.replace(/[\s-]/g, "").replace(/^0/, ""));
export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
