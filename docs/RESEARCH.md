# Research log — 2026-11-23

## Evidence

- [ReGame-Labs/dw3_decomp](https://github.com/ReGame-Labs/dw3_decomp): matching decompilation of both regional executables. The key findings are format versions 3/4, differing region names, equal slot stride, eight additional bytes of state, and regional event-array lengths. Direct source links are pinned in `FORMAT.md`.
- [Versions documentation](https://regame-labs.github.io/dw3_decomp/docs_binaries.html): 238 shared stages and 55 extra EU internal stages. Shared stages need not have identical event scripts. The main campaign broadly corresponds; post-campaign content is intentionally not described here.
- [GameFAQs conversion discussion](https://gamefaqs.gamespot.com/ps/562323-digimon-world-3/answers/240138-can-i-convert-somehow-dmw-3-savegame-into-dmw-2003-for-emulator-): historic failed attempt; not evidence of impossibility. Linked community discussions may contain spoilers.
- [GameFAQs regional comparison](https://gamefaqs.gamespot.com/boards/562323-digimon-world-3/67627304), [With the Will forum](https://withthewill.net/threads/are-there-any-differences-between-digimon-world-2003-and-digimon-world-3-us.16084/): differing battle balance, fishing and extra content; anecdotal rates and other mechanics need source verification. The counterattack implementation has an EU-only probability check.
- [MemcardRex](https://github.com/ShendoXT/memcardrex): general memory-card utility; modifying a directory identifier is not a game-state conversion. [PS1 region header technique](https://janstechblog.blogspot.com/2014/01/howto-changing-region-on-ps1-savegames.html) assumes compatible internal payloads.
- [DW3 Save Editor](https://github.com/grant-might/DW3_SaveEditor): supports USA/EUR editing, checksums and read-only binary inspection, but the README does not advertise region conversion. Useful reference and comparison tool; its license is noncommercial with redistribution conditions. No code copied. This project implements the format independently.
- [Reddit emulator discussion](https://www.reddit.com/r/EmulationOnPC/comments/1adq8yr): anecdotal memory-card and emulator compatibility issues reinforce testing in a clean runtime. Not evidence of conversion success.

## Unresolved questions

1. Compare matched USA/EU clean cards and later campaign checkpoints. Verify flag identity across shared regional scripts, especially group 40, new flags and summary location indexes.
2. Check item/partner/card identifiers and regional defaults beyond layout; confirm exact save header title and language behavior.
3. Test real EU loading (not merely valid checksum), progressing through events, resave and reload. Never test directly against a live card.
4. Determine whether regional play-time frame units need normalization; v0.1 preserves the raw values exactly.

No public converter that demonstrably solves full progression migration was located in this initial search. This is an explicit research limit, not proof none exists.

## Independent binary samples (2026-11-23)

Read the editor's published [USA sample](https://github.com/grant-might/DW3_SaveEditor/blob/main/samples/USA_dexdrive.gme) (blob `faeb4774f67aedcc851807da3448cc8d96787b1a`) and [EUR sample](https://github.com/grant-might/DW3_SaveEditor/blob/main/samples/EUR_raw.mcr) (blob `4394246863470922b26e48423079e4d067977dd6`) without redistributing either. The former has a 0xF40-byte DexDrive wrapper; the raw card in each is exactly 0x20000 bytes. Both have a four-block allocation, three icons, index at 0x200, and their expected region names and internal versions. The index checksum and every occupied slot checksum matched the independent XOR computation using the correct regional payload size. This confirms the structural model, not cross-region semantic equivalence: the samples do not represent matching campaign states.
