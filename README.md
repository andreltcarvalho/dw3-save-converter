# DW3 Save Converter

Experimental, spoiler-free USA → Europe memory-card migration for the original PlayStation Digimon World 3 / Digimon World 2003.

**Do not replace your live save.** The converter reads the input and creates a new memory card; it refuses to overwrite an existing output. Even a structurally correct conversion may fail later in gameplay. v0.1 requires an explicit experimental opt-in.

## Usage (Node.js 20+; no dependencies)

```sh
npm test
node src/cli.mjs inspect original-copy.mcd
node src/cli.mjs convert original-copy.mcd converted-eu.mcd --experimental
node src/cli.mjs inspect converted-eu.mcd
node src/cli.mjs verify original-copy.mcd converted-eu.mcd
```

Only raw 128 KiB PS1 memory card images are supported. Use the standard European language selection on the target game. Test the output in a separate game environment before trusting it. No ROMs or real saves are included.

## Specification-driven development

- [Specification](docs/SPEC.md) — requirements and release gates.
- [Binary format](docs/FORMAT.md) — versioned layout and mapping assumptions.
- [Research](docs/RESEARCH.md) — primary and community evidence.
- [Validation](docs/VALIDATION.md) — automated and runtime test protocol.

Changes to behavior require matching specification and regression tests in the same commit.
