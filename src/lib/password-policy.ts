export type PasswordStrengthLevel = "Fraca" | "Média" | "Forte" | "Muito forte";

export type PasswordCriterion = {
  id: string;
  label: string;
  met: boolean;
};

const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "password",
  "password1",
  "admin123",
  "admin123!",
  "qwerty123",
  "qwerty123!",
  "abc12345",
  "a1234567",
  "11111111",
  "letmein",
  "welcome1"
]);

export function isCommonPassword(password: string) {
  return COMMON_PASSWORDS.has(password.trim().toLowerCase());
}

export function getPasswordCriteria(password: string): PasswordCriterion[] {
  return [
    { id: "length", label: "8 caracteres ou mais", met: password.length >= 8 },
    { id: "uppercase", label: "1 letra maiúscula", met: /[A-Z]/.test(password) },
    { id: "lowercase", label: "1 letra minúscula", met: /[a-z]/.test(password) },
    { id: "number", label: "1 número", met: /\d/.test(password) },
    { id: "special", label: "1 caractere especial", met: /[^A-Za-z0-9]/.test(password) },
    { id: "common", label: "Não é uma senha comum", met: !isCommonPassword(password) }
  ];
}

export function evaluatePasswordStrength(password: string) {
  const criteria = getPasswordCriteria(password);
  const metCount = criteria.filter((criterion) => criterion.met).length;
  let score = metCount;

  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (/(.)\1{2,}/.test(password)) score -= 1;
  if (isCommonPassword(password)) score = Math.min(score, 1);

  const normalizedScore = Math.max(0, Math.min(8, score));
  const level: PasswordStrengthLevel =
    normalizedScore >= 7
      ? "Muito forte"
      : normalizedScore >= 6
        ? "Forte"
        : normalizedScore >= 4
          ? "Média"
          : "Fraca";

  return {
    criteria,
    level,
    score: normalizedScore,
    percentage: Math.max(12, Math.round((normalizedScore / 8) * 100)),
    valid: criteria.every((criterion) => criterion.met)
  };
}

export function validateStrongPassword(password: string) {
  const result = evaluatePasswordStrength(password);

  if (!result.valid) {
    throw new Error("A senha não atende aos requisitos mínimos de segurança.");
  }

  return result;
}
