import { createHash } from "node:crypto";
import { canonicalStringify } from "@honeychain/shared";

export function appendCustodyHash(prevHash: string, payload: any): string {
  const content = prevHash + canonicalStringify(payload);
  return createHash("sha256").update(content).digest("hex");
}
