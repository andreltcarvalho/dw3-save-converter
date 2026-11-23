# Validation protocol

## Automated

- `npm test`: synthetic 128 KiB cards, one/multiple occupied slots, fragmented chain, zero extension, checksum/version changes, unrelated-block invariants, rejection of malformed and lossy inputs, and output-file exclusivity.
- Real private card inspection/conversion: snapshot the original with a new file name, compare SHA-256 before/after, parse the snapshot, convert to a separate output, independently inspect it. Never publish card bytes or player-specific hashes.

## Runtime acceptance (pending)

1. Start a clean, independent EU emulator / native port with a disposable memory card. Produce an ordinary save in that version and inspect it for comparison.
2. Point only the isolated runtime at a **copy** of the converter output. Fully restart it. Confirm the slot list, then load each occupied slot.
3. Check party, attributes, inventory, collection, unlocked forms, play time, location and current objective against the USA copy. No personal details in public results.
4. Test multiple rooms, combat, equipment, menus, saving another slot and reloading after restart. Check progression through the next normal event; compare with the USA copy where feasible.
5. Record outcome as PASS/FAIL per requirement and checkpoint. Stop if a discrepancy appears; do not substitute this card for the user's original.

Structural verification is not runtime verification. Do not label the tool stable until the release gates are complete.

## v0.1 results (2026-11-23)

| Check | Result |
| --- | --- |
| Node synthetic tests | PASS — all 5 test cases |
| Independent public USA/EUR sample layout and checksums | PASS |
| Private real source: region, index and occupied-slot checksums | PASS |
| Experimental output: region 4, card size, checksums, preserved occupied slots | PASS |
| Independent byte comparison of common state 0x0004–0x2643 | PASS — no differences |
| Original live card and private snapshot SHA-256 before/after | PASS — identical, no edits |
| Matched-state flag audit / EU runtime loading and progression | PENDING |

No private memory cards, personal information or hashes are included in this repository.
