import { verify } from "node:crypto";
import { canonicalStringify } from "@honeychain/shared";

export function verifyEd25519Signature(payload: any, publicKeyDerBase64: string): boolean {
  try {
    const { signature, ...unsignedPayload } = payload;
    const data = Buffer.from(canonicalStringify(unsignedPayload));
    const publicKey = {
      key: Buffer.from(publicKeyDerBase64, "base64"),
      format: "der" as const,
      type: "spki" as const
    };
    return verify(null, data, publicKey, Buffer.from(signature.value, "base64"));
  } catch (err) {
    return false;
  }
}
