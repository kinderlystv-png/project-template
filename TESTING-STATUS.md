# Test status summary

- Date: current session
- Runner: Vitest v3.2.4 (jsdom, threads)
- Files: 15
- Tests: 100 passed, 3 skipped
- Duration: ~5.8s (local)

Notes

- Coverage is now enforced in CI only. Locally, tests run without coverage gating to keep the workflow fast and green. To check coverage locally, set environment variable COVERAGE=true before running tests.
- Pre-push hook runs the full test suite and a build.

CI expectations

- Lint, type-check, coverage, and build must pass in CI. Coverage thresholds: lines 75, functions 75, branches 65, statements 75.
