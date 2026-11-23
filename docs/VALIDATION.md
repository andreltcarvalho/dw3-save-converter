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
| Initial EU runtime load of one converted slot | PASS (user-observed playable field; provisional) |
| Visible game data inspection | PASS (user-observed; spot check) |
| Matched-state flag audit / gameplay progression and resave | PENDING |

No private memory cards, personal information or hashes are included in this repository.

## EU runtime preparation (2026-11-23)

- Verified the canonical European disc SHA-1 against the decompilation documentation. Copied the executable, toolchain, disc and converted card into an isolated lab with its own APPDATA, LOCALAPPDATA and temp paths.
- The installed Recomp recognized the EUR disc and completed analysis and translation. Preparation failed before gameplay: Zig could not rename a temporary object in its cache while compiling `MAIN_resume.c`. A direct diagnostic compile reproduced the cache rename error in separate private caches. The isolated card remained byte-identical to the converted output. No original card was opened for writing.
- The live USA card has progressed independently since the initial snapshot; the existing experimental result is for the earlier snapshot. Do not equate that snapshot with the live state.
- `tools/run-eu-lab.ps1` provides a guarded Windows launcher for the already prepared private lab (not a distributable runtime). It verifies local copies and redirects profile/cache paths; `-PrepareOnly` checks compilation without launching gameplay. Run in a normal user PowerShell session if the sandbox compiler cannot perform its rename operation. Runtime acceptance remains pending.

## First runtime load (2026-11-23)

- The isolated Recomp completed compilation when run by the user. The user reports successfully loading the converted slot; a screenshot shows the playable field. The generated module exists and the lab's card remains identical to the prepared converted card, so no in-game resave is yet evidenced.
- ReShade's first-run overlay and screenshot notification were visible. The copied `dxgi.dll` identifies itself as ReShade 6.8; its private log confirms swap-chain hooks and screenshot capture. After the lab exited, the copied DLL was renamed to `dxgi.reshade-disabled.dll` (reversible); the installed game's DLL was untouched. A lower-edge rendering artifact was also visible; cause not yet established. Do not attribute it to save conversion or to ReShade without a clean retest.
- Next: reopen the isolated game without ReShade, check status/inventory, traverse rooms, fight a battle, save in a different slot and restart/reload. Then verify the resulting EU card structurally. No original file or screenshot is published.

## Second runtime check (2026-11-23)

- User reports that the visible game data was present and normal after loading without ReShade. No in-game resave was performed; independent read-only verification still succeeds on the lab card. Full progression compatibility remains unverified.
- Lower-edge corruption persisted without ReShade and despite graphics settings changes. A separate runtime hypothesis is supported by the shared Recomp GPU code: `write_gp1` sets noninterlaced PAL display height to 256, while the original game's [graphics header](https://github.com/ReGame-Labs/dw3_decomp/blob/791932b757b358bb8228f851ce96f4d22ae112dd/include/engine/gfx.h) defines the drawing surface as 320 x 240. `snapshot_display` reads that full nominal height directly from VRAM. The extra 16 rows can expose offscreen texture data, consistent with the artifact; not yet verified by a corrected build. This does not establish a save-conversion defect. Keep any rendering fix separate from the converter and validate against fresh EUR and existing converted saves.

## Additional private checkpoint (2026-11-23)

- Converted a newer USA snapshot to a new EUR file and independently verified all structural and preservation checks. The live USA card and previous EUR laboratory card retained their original SHA-256 hashes. A separate disposable copy is available for the next runtime test; no previous save was overwritten.
- The lab launcher accepts `-CardName` to select an existing `.mcd` file by safe basename within its isolated profile. Default behavior remains unchanged. Absolute paths and path traversal are rejected by parameter validation; all existing isolation checks still apply.
