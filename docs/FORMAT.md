# Binary format

Offsets are hexadecimal and relative to each enclosing structure. PS1 raw memory-card image: 0x20000 bytes; 16 blocks of 0x2000 bytes; block 0 contains the directory. Directory entries 1–15 are 0x80-byte frames. Status 0x51 marks an active first block, 0x52 a middle block, 0x53 a terminal block. The next pointer at +8 is zero-based (`0xffff` = end). First block size at +4 is 0x8000 for this game; name at +0x0a spans 20 bytes. Frame XOR at +0x7f covers bytes 0..126.

Source name `BASLUS-01436DMW3-USA`; target standard EU name `BESLES-03936DMW3-EUR`. The EU code also uses other names for alternate language IDs; v0.1 targets standard European locales only. The US name alone does not prove format 3.

The four-block file is reconstructed in chain order. Header `SC`, icon count = low nibble of byte 2 (1..3); allocation count at byte 3 = 4. Info starts at `0x80 * (1 + icons)`, contains 0xD4 bytes of data in a reserved 0x100-byte section. Byte 0 checksum = XOR bytes 4..0xD3, byte 1 last slot, byte 2 version, bytes 4..7 ASCII `DMW3`. Three summaries start at +8, stride 0x44; first name byte zero means empty. Summary area/place indices are preserved provisionally (must be checked against matching EU saves).

Slot payload base = info offset + 0x100; stride = 0x2700. Payload lengths are 0x26BC (USA) and 0x26C4 (EU), version at +2, XOR of bytes +4..end at +0. Reserved bytes after payload are not game state. The original header/icon bytes and summaries are retained; the EU game may update them on resave. All writes remain within the existing four-block allocation.

## Event arrays

The state up to 0x2644 has the same field layout in both versions. The game accesses flags using group and bit index; the operation is identical across versions. Structural mapping preserves each group's overlapping prefix; newly allocated bytes zero. This is a hypothesis of semantic equivalence, not proof that regional scripts interpret every bit identically.

| Group | US offset | US length | EU offset | EU length |
| --- | ---: | ---: | ---: | ---: |
| 02 | 2644 | 0D | 2644 | 12 |
| 04 | 2651 | 02 | 2656 | 02 |
| 06 | 2653 | 01 | 2658 | 01 |
| 08 | 2654 | 01 | 2659 | 01 |
| 0A | 2655 | 02 | 265A | 04 |
| 0C | 2657 | 08 | 265E | 08 |
| 0E | 265F | 0C | 2666 | 0C |
| 10 | 266B | 02 | 2672 | 04 |
| 18 | 266D | 01 | 2676 | 02 |
| 1A | 266E | 09 | 2678 | 09 |
| 1C | 2677 | 0B | 2681 | 0B |
| 20 | 2682 | 1E | 268C | 1E |
| 40 | 26A0 | 1C | 26AA | 1A |

Group 40 tail (2 bytes) must be zero; otherwise conversion refuses instead of discarding data. EU-specific initialized flags and remapped meanings require additional audit. No events are force-completed.

Primary evidence: [GameState](https://github.com/ReGame-Labs/dw3_decomp/blob/791932b757b358bb8228f851ce96f4d22ae112dd/include/engine/game_state.h), [memory-card engine](https://github.com/ReGame-Labs/dw3_decomp/blob/791932b757b358bb8228f851ce96f4d22ae112dd/src/engine/memcard/memcard.c), [menu structs](https://github.com/ReGame-Labs/dw3_decomp/blob/791932b757b358bb8228f851ce96f4d22ae112dd/include/menus/memory_card.h), [load/save routines](https://github.com/ReGame-Labs/dw3_decomp/blob/791932b757b358bb8228f851ce96f4d22ae112dd/src/menus/memory_card/saves.c), [event accessors](https://github.com/ReGame-Labs/dw3_decomp/blob/791932b757b358bb8228f851ce96f4d22ae112dd/src/engine/game/events.c).
