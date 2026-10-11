import { describe, expect, it } from "bun:test";
import { saveHarvestDraft, loadHarvestDraft, clearHarvestDraft } from "../src/lib/draft-store";

describe("Harvest Draft Store (idb-keyval with memory fallback)", () => {
  it("should persist and retrieve multi-step harvest draft locally", async () => {
    const draft = { step: 3, hiveId: "HV-012", weightBeforeKg: 58.0, moisturePct: 17.8 };
    await saveHarvestDraft(draft);
    const loaded = await loadHarvestDraft();
    expect(loaded).toEqual(draft);
    await clearHarvestDraft();
    const afterClear = await loadHarvestDraft();
    expect(afterClear).toBeNull();
  });
});
