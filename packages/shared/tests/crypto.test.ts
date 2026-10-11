import { describe, expect, it } from "bun:test";
import { canonicalHash, canonicalStringify, computeMerkleRoot } from "../src/crypto/canonical";

describe("Canonical Hashing and Merkle", () => {
  it("should sort object keys deterministically (RFC 8785 style)", () => {
    const objA = { b: 2, a: 1, c: { y: "test", x: 10 } };
    const objB = { a: 1, c: { x: 10, y: "test" }, b: 2 };
    expect(canonicalStringify(objA)).toBe('{"a":1,"b":2,"c":{"x":10,"y":"test"}}');
    expect(canonicalStringify(objA)).toBe(canonicalStringify(objB));
    expect(canonicalHash(objA)).toBe(canonicalHash(objB));
  });

  it("should compute deterministic Merkle root from leaf hashes", () => {
    const leaf1 = "9f3a1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab";
    const leaf2 = "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0";
    const root = computeMerkleRoot([leaf1, leaf2]);
    expect(root).toBeDefined();
    expect(root.length).toBe(64);
  });
});
