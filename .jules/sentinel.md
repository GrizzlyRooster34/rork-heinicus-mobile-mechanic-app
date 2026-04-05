
## $(date +%Y-%m-%d) - Insecure Random Number Generation for 2FA Codes
**Vulnerability:** Found `Math.random()` being used to generate 6-digit SMS verification codes in the 2FA TRPC routes (`expo/backend/trpc/routes/two-factor/route.ts`).
**Learning:** `Math.random()` is not a cryptographically secure pseudo-random number generator (CSPRNG), making security tokens predictable. The backend runs on Node.js, so the built-in `crypto` module is fully available and should be used instead.
**Prevention:** Never use `Math.random()` for generating authentication codes, tokens, or passwords. Always use `crypto.randomInt` or `crypto.randomBytes` in the Node environment to ensure unpredictability.
