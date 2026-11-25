// One password rule set for sign-up and new password: the schema and the live checklist both use it.

const PASSWORD_RULES = [
  { label: "8+ characters", test: (password: string) => password.length >= 8 },
  { label: "A letter", test: (password: string) => /[a-z]/i.test(password) },
  { label: "A number", test: (password: string) => /\d/.test(password) },
] as const;

export const PASSWORD_HINT = "Use at least 8 characters, with a letter and a number";

export function checkPassword(password: string) {
  return PASSWORD_RULES.map(({ label, test }) => ({ label, met: test(password) }));
}

export function isStrongPassword(password: string) {
  return PASSWORD_RULES.every(({ test }) => test(password));
}
