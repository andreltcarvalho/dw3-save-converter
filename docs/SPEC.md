# Specification — USA → Europe memory-card converter

Status: v0.1 experimental; structural gate passed on synthetic fixtures and a private real USA card. First EU load reached the playable field (user-observed); complete runtime compatibility is **not verified**. No story spoilers.

## Goal

Transfer a native PS1 memory-card save from Digimon World 3 USA (SLUS-01436, format 3) to Digimon World 2003 Europe (SLES-03936, format 4), keeping existing play progression and collections. The objective is not to unlock or alter gameplay content.

## Requirements

| ID | Requirement | Acceptance |
| --- | --- | --- |
| R01 | Read a raw 128 KiB memory-card image; never modify input. | Input hash identical before/after conversion. |
| R02 | Identify US save by native directory name AND internal version. Reject malformed or ambiguous cards and pre-existing EUR entry. | Synthetic negative cases. |
| R03 | Traverse the four-block PS1 chain (including fragmented cards), validating directory XOR checks and ownership. | Fragmented-chain and corruption tests. |
| R04 | Validate the three-slot index and every occupied slot's version/checksum. Empty slots remain untouched. | All occupied slots validated, no slot silently dropped. |
| R05 | Keep bytes 0x0004–0x2643 identical; map event arrays by group and index, zero-fill new bytes, refuse truncation of any nonzero bytes. | Byte-for-byte invariants; flag migration tests. |
| R06 | Set region name and format version, recompute XOR checksums, preserve unrelated card blocks and header/icon asset. | Output independently reparsed as EU format; no unrelated blocks changed. |
| R07 | Write a new output file exclusively; never overwrite any path, including input or symlinks. | CLI refusal tests. |
| R08 | Require explicit `--experimental` until semantic/gameplay validation is complete. Inspect must never write. | CLI behavior tests. |
| R09 | Report occupied slot count, region and structural validation; do not display personal details or future events. | CLI output and review. |
| R10 | Verify an existing converted card against its USA source without writing either, checking every mapped field and unaffected allocation. | Independent read-only comparison rejects valid-checksum but changed fields. |

## Non-goals (v0.1)

- Emulator savestates, alternate file containers, JP, or reverse conversion.
- A GUI, save editing, rewards, gameplay changes, or any automatic replacement of a live memory card.
- Guaranteeing identical gameplay behavior based on checksums alone. Runtime validation is a separate gate.

## Release gates

1. Structural conversion and synthetic tests (v0.1) — **PASS**.
2. Compare independently produced USA/EUR cards at matching campaign states; audit regional script and flag semantics. Public evidence must be spoiler-free.
3. Validate loading, movement, battles, menus, re-saving and reloading in a clean EU game environment using disposable copies. Initial load passed provisionally on one real slot; movement, battle, menus, resave/reload and event transitions remain pending, as do additional checkpoints and slots.
4. Only after gates 2 and 3 pass can conversion stop requiring the experimental opt-in. UI work should follow reliable core conversion.

See `FORMAT.md` for binary layout, `RESEARCH.md` for evidence, and `VALIDATION.md` for test protocol.
