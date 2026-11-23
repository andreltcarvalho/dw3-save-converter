# Development contract

- Read `docs/SPEC.md`, `docs/FORMAT.md`, `docs/RESEARCH.md` and `docs/VALIDATION.md` before changing converter code.
- Update the specification and its traceable test coverage in the same commit as any behavior change. Mark hypotheses explicitly; never promote an untested hypothesis to a guarantee.
- Run `npm test` and record private real-card validation without publishing personal data. Keep the UI, logs and public docs spoiler-free (event groups only, no story names or future events).
- Never write, rename, delete, launch a game against, or otherwise modify an original save. Read originals only to make an explicit private copy; all experiments run on isolated copies. Output MUST be a new path, created exclusively. Do not accept an overwrite flag.
- Never commit memory cards, private fixtures, ROMs, screenshots of player saves or identifiable player information. Synthetic fixtures only in Git; use `lab-private/` for actual cards.
- Commit specification, implementation and tests together and push them to the authorized GitHub repository after checks. Do not force-push. Confirm the remote head and report any push blocker.
