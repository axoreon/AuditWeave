export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordRequirementKey = "length" | "uppercase" | "lowercase" | "number" | "special";

export const PASSWORD_REQUIREMENTS: ReadonlyArray<{
  key: PasswordRequirementKey;
  label: string;
  test: (password: string) => boolean;
}> = [
  {
    key: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
  },
  { key: "uppercase", label: "One uppercase letter (A-Z)", test: (password) => /[A-Z]/.test(password) },
  { key: "lowercase", label: "One lowercase letter (a-z)", test: (password) => /[a-z]/.test(password) },
  { key: "number", label: "One number (0-9)", test: (password) => /[0-9]/.test(password) },
  { key: "special", label: "One special character", test: (password) => /[^A-Za-z0-9]/.test(password) },
];

export function getPasswordRequirementState(password: string): Record<PasswordRequirementKey, boolean> {
  return Object.fromEntries(
    PASSWORD_REQUIREMENTS.map((requirement) => [requirement.key, requirement.test(password)]),
  ) as Record<PasswordRequirementKey, boolean>;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmailField(email: string): string | null {
  const e = normalizeEmail(email);
  if (!e) return "Email address is required.";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(e)) return "Enter a valid email address.";
  
  // Catch common domain typos
  const domain = e.split("@")[1];
  const commonTypos: Record<string, string> = {
    "gma.com": "gmail.com",
    "gail.com": "gmail.com",
    "gmial.com": "gmail.com",
    "gmail.con": "gmail.com",
    "yaho.com": "yahoo.com",
    "yahoo.con": "yahoo.com",
    "hotmal.com": "hotmail.com",
    "hotmail.con": "hotmail.com",
    "outlok.com": "outlook.com",
    "outlook.con": "outlook.com",
  };
  
  if (commonTypos[domain]) {
    return `Did you mean ${commonTypos[domain]}?`;
  }
  
  return null;
}

export function validatePasswordField(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be no more than ${PASSWORD_MAX_LENGTH} characters.`;
  }
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter (A-Z).";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter (a-z).";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number (0-9).";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character.";
  return null;
}

export function validatePasswordConfirmation(password: string, confirmation: string): string | null {
  if (!confirmation) return "Please confirm your password.";
  if (password !== confirmation) return "Passwords do not match.";
  return null;
}

export function validateLogin(email: string, password: string): string | null {
  const emailErr = validateEmailField(email);
  if (emailErr) return emailErr;
  if (!password) return "Password is required.";
  return null;
}

export function validateSignup(email: string, password: string, confirmation: string): string | null {
  const emailErr = validateEmailField(email);
  if (emailErr) return emailErr;
  
  const passErr = validatePasswordField(password);
  if (passErr) return passErr;

  return validatePasswordConfirmation(password, confirmation);
}
