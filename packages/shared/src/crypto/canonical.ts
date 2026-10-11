import { createHash } from "node:crypto";

export function canonicalStringify(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalStringify).join(",") + "]";
  }
  const keys = Object.keys(obj).sort();
  const entries = keys.map((key) => `${JSON.stringify(key)}:${canonicalStringify(obj[key])}`);
  return "{" + entries.join(",") + "}";
}

export function canonicalHash(payload: any): string {
  const json = canonicalStringify(payload);
  return createHash("sha256").update(json).digest("hex");
}

export function computeMerkleRoot(leaves: string[]): string {
  if (leaves.length === 0) return createHash("sha256").update("").digest("hex");
  if (leaves.length === 1) return leaves[0];

  let currentLevel = [...leaves];
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      const combined = createHash("sha256").update(left + right).digest("hex");
      nextLevel.push(combined);
    }
    currentLevel = nextLevel;
  }
  return currentLevel[0];
}
