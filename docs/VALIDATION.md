# Validation protocol

## Automated

- `npm test`: synthetic 128 KiB cards, one/multiple occupied slots, fragmented chain, zero extension, checksum/version changes, unrelated-block invariants, rejection of malformed and lossy inputs, and output-file exclusivity.
- `node src/cli.mjs verify SOURCE OUTPUT`: read-only comparison of all preserved data, event arrays and zero-filled extensions, and the untouched parts of the card, against the independently parsed source.
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
| Node synthetic tests | PASS — all 6 test cases |
| Independent public USA/EUR sample layout and checksums | PASS |
| Private real source: region, index and occupied-slot checksums | PASS |
| Experimental output: region 4, card size, checksums, preserved occupied slots | PASS |
| Independent byte comparison of common state 0x0004–0x2643 | PASS — no differences |
| Read-only verifier: every shared flag group, extension, unrelated block and summary | PASS |
| Original live card and private snapshot SHA-256 before/after | PASS — identical, no edits |
| Matched-state flag audit / EU runtime loading and progression | PENDING |

No private memory cards, personal information or hashes are included in this repository.

## EU runtime preparation (2026-11-23)

- Verified the canonical European disc SHA-1 against the decompilation documentation. Copied the executable, toolchain, disc and converted card into an isolated lab with its own APPDATA, LOCALAPPDATA and temp paths.
- The installed Recomp recognized the EUR disc and completed analysis and translation. Preparation failed before gameplay: Zig could not rename a temporary object in its cache while compiling `MAIN_resume.c`. A direct diagnostic compile reproduced the cache rename error in separate private caches. The isolated card remained byte-identical to the converted output. No original card was opened for writing.
- The live USA card has progressed independently since the initial snapshot; the existing experimental result is for the earlier snapshot. Do not equate that snapshot with the live state.
- `tools/run-eu-lab.ps1` provides a guarded Windows launcher for the already prepared private lab (not a distributable runtime). It verifies local copies and redirects profile/cache paths; `-PrepareOnly` checks compilation without launching gameplay. Run in a normal user PowerShell session if the sandbox compiler cannot perform its rename operation. Runtime acceptance remains pending.
