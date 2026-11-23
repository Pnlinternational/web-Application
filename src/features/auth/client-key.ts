/** 32 random bytes, base64url (43 chars). Made once per password-reset flow, sent to verify and complete. */
export function createClientKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}
