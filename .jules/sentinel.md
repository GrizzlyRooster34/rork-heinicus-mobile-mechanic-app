
## 2026-03-28 - [CRITICAL] Insecure Random Number Generation for 2FA Codes
**Vulnerability:** The `Math.random()` function was used to generate 6-digit SMS Two-Factor Authentication codes. `Math.random()` is not cryptographically secure, meaning its outputs are predictable. This could allow an attacker to guess 2FA codes and bypass authentication.
**Learning:** For any security-critical feature involving random values (like tokens, passwords, or 2FA codes), a cryptographically secure pseudorandom number generator (CSPRNG) must be used.
**Prevention:** Always use the `crypto` module (e.g., `crypto.randomInt()`, `crypto.randomBytes()`) or `expo-crypto` (in Expo context) instead of `Math.random()` for security-sensitive operations.
