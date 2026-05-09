## Task Analysis

- Main objective: Deliver STR-2 by building one typed album source of truth in `src/data/album.ts` and one integrity suite in `src/data/album.test.ts`, with STR-4 → STR-5 → STR-6 executed strictly in order.
- Identified dependencies: Authoritative inputs are the PRD, reference PDF, and Linear acceptance criteria; STR-5 depends on STR-4, STR-6 depends on STR-5; `vitest.config.ts` currently only includes `test/**/*.test.ts`, so it must be updated or `src/data/album.test.ts` will never run.
- System impact: This module becomes the foundation for navigation, persistence, progress, share/export, and i18n. Any page-order or identifier mistake will cascade into later features.

## Chosen Approach

- Proposed solution: Keep one authoritative `src/data/album.ts` module with discriminated page types, structural constants, tiny pure sticker/page builders, and one ordered `albumPages` dataset. Add a co-located `src/data/album.test.ts` integrity suite. Make only an additive `vitest.config.ts` include change so co-located source tests execute.
- Justification for simplicity: Reject split domain folders, generated JSON, and exhaustive 994-value literal unions. One TypeScript module keeps review against PRD/PDF easy. Small builders reduce transcription mistakes without hiding data behind abstractions. Tests, not heavy type machinery, enforce long-term integrity.
- Components to be modified/created:
  - `src/data/album.ts` — new domain types, constants, dataset, minimal helpers.
  - `src/data/album.test.ts` — new integrity unit suite.
  - `vitest.config.ts` — additive test include update for `src/**/*.test.ts`.
  - `docs/plan/Plan STR-2 EP2: Album Domain Model + Data Integrity.md` — this plan.

## Implementation Steps

1. Lock source-of-truth inputs and gate order before code changes.
   - Use PRD, PDF, and Linear as the only album references.
   - Confirm strict sequence: finish STR-4, validate, then STR-5, validate, then STR-6.
   - Assume globally unique normalized `StickerIdentifier` values derived from page metadata, because STR-6 requires duplicate detection across the album. If implementation friction appears, stop and confirm identifier format before proceeding.
2. Execute STR-4 in `src/data/album.ts`.
   - Create `src/data/` if missing.
   - Define and export `Group`, `StickerRange`, `StickerIdentifier`, `PageId`, `TeamPage`, `SpecialPage`, and `AlbumPage`.
   - Define and export shared constants needed by later tasks: page totals, team/special counts, team stickers per page, group sticker total, album sticker total, group list, special page counts/order, and team sticker ranges `1–10` / `11–20`.
   - Keep the API narrow: discriminated unions and readonly shapes; avoid separate `src/domain/` or loose ad-hoc object types.
3. Validate STR-4 before moving on.
   - Run `pnpm typecheck`.
   - Review exports against STR-4 acceptance criteria: required types exist, shared constants exist, and the domain API is not just broad string bags.
   - Rollback/mitigation: if branded or template-literal types create noise without real safety, simplify to clear discriminated types plus constants and let STR-6 enforce runtime integrity.
4. Execute STR-5 in `src/data/album.ts`.
   - Encode special pages first: `fwc-opening`, `fwc-closing`, `coca-cola`, with exact ordered sticker lists and translation keys.
   - Encode all 48 team pages next, grouped A–L in exact album order, with `albumCode`, `flagCode`, stable `pageId`, translation key, group, sticker ranges, and normalized sticker identifiers.
   - Export one ordered top-level dataset array for album traversal; derive secondary lists or maps only if tests or downstream readers truly need them.
   - Mitigation: if manual repetition raises error risk, add tiny local builders like `createTeamPage` / `createSpecialPage`; do not introduce JSON generation, CSV parsing, or extra folders.
5. Validate STR-5 before moving on.
   - Spot-check opening page, one mid-album team page, one late-album team page, closing page, and Coca-Cola against the PRD/PDF.
   - Verify edge-case flag codes stay exact: `gb-eng`, `gb-sct`.
   - Confirm 51 pages total, 48 team pages, 3 special pages, stable unique `pageId` values, and no drift from Linear acceptance criteria.
6. Execute STR-6 in `src/data/album.test.ts`, then make tests discoverable.
   - Update `vitest.config.ts` unit include pattern to add `src/**/*.test.ts` and `src/**/*.test.tsx` without changing coverage thresholds or existing browser exclusions.
   - Add integrity tests for exact page order, 51 total pages, 48/3 team-vs-special split, 20 stickers per team, group totals of 4 teams and 80 stickers, special counts `9/11/14`, album total `994`, unique `pageId` values, and unique normalized `StickerIdentifier` values.
   - Add metadata assertions for team pages (`albumCode`, `flagCode`, translation key, group, ranges) and ordered special-page sticker IDs.
   - Mitigation: keep tests data-driven and derived from exported constants where safe, but do not duplicate implementation logic so the suite can still catch bad data.
7. Run final verification after STR-6.
   - Run `pnpm typecheck` and `pnpm test`.
   - Perform one deliberate local break-check: temporarily duplicate one sticker ID or alter one count, confirm a test fails, then restore clean data.
   - Final gate: no coverage-threshold edits, no parallelized work, and all three Linear tasks satisfied in sequence.

## Validation

- Success criteria:
  - STR-4: required domain types exist for album pages, team pages, special pages, groups, sticker ranges, sticker identifiers, and page IDs; shared album/group constants exist; the domain API avoids unnecessary loose string-only shapes.
  - STR-5: `src/data/album.ts` contains 51 pages in exact album order, 48 team pages, 3 special pages, stable unique `pageId` values, team metadata (`albumCode`, `flagCode`, translation key, group, normalized sticker identifiers), and special-page ordered sticker identifiers plus translation keys.
  - STR-6: `src/data/album.test.ts` fails on ordering drift or duplicate IDs, asserts total stickers `994`, each group `80`, and special counts `9`, `11`, and `14`.
  - Repo-level: `vitest.config.ts` discovers the new co-located test file; `pnpm typecheck` and `pnpm test` pass; Vitest coverage thresholds stay unchanged.
- Checkpoints:
  - Pre-implementation: PRD/PDF/Linear inputs reconciled; normalized sticker identifier convention agreed or explicitly assumed.
  - After STR-4: types and constants compile and match PRD vocabulary exactly.
  - After STR-5: manual sample review confirms order, page metadata, group structure, and special-page counts.
  - After STR-6: integrity suite catches an intentional regression and passes again after restore.
  - Final: sequential delivery proven — STR-4 complete before STR-5, STR-5 complete before STR-6; all acceptance criteria met at the exact file locations.
