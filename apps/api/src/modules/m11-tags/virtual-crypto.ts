import { createHmac } from "node:crypto";

export function generateVirtualTap(uid: string, counter: number, masterKeyHex: string): string {
  const data = `${uid}:${counter}`;
  return createHmac("sha256", Buffer.from(masterKeyHex, "hex")).update(data).digest("hex").slice(0, 16);
}

export function verifyVirtualTap(
  uid: string,
  counter: number,
  receivedTapCode: string,
  masterKeyHex: string,
  lastRecordedCounter: number
): { valid: boolean; reason?: string } {
  if (counter <= lastRecordedCounter) {
    return { valid: false, reason: "COUNTER_REPLAY" };
  }
  const expectedTapCode = generateVirtualTap(uid, counter, masterKeyHex);
  if (expectedTapCode !== receivedTapCode) {
    return { valid: false, reason: "SIGNATURE_INVALID" };
  }
  return { valid: true };
}
