# N13. Package Integrity Verifier

**Difficulty:** Easy
**Topics:** Crypto, Hashing, Security

---

## Description

Compute the SHA-512 SRI hash of a package tarball's contents and compare it to
the registry-reported `integrity` field (`sha512-<base64>`).

## Examples

```ts
const integrity = computeIntegrity(buffer);
verifyIntegrity(buffer, integrity); // true
```

## Constraints

- Use Node's `crypto.createHash('sha512')`, base64-encoded.
- Compare in constant-ish time conceptually; exact match is enough here.
