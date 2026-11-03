# Handoff — Fork Setup & Remotes

> Current state (2026-11-03): **pushed.** `payswapdotorg/PlayLiquid-2.0`
> carries the full upstream history, tags, and the additive milestone-1
> commits on `main`, tagged `playliquid-m1`.

## Remotes

| Remote | URL | Role |
|---|---|---|
| `origin` | `https://github.com/payswapdotorg/PlayLiquid-2.0.git` | the product fork (upstream history + additive work) |
| `upstream` | `https://github.com/zai-org/ZCode.git` | the official ZCode repository (read-only tracking) |

Credentials are supplied by a git credential helper that reads the token from
the environment / a gitignored secrets file. **Tokens are never committed,
never embedded in remotes, never written to tags or commit messages.**

## Verified baseline

- Baseline commit: `a9fe401eede6e6e5e01be9048679c206fe6f02d9`
  ("chore: sync ZCode source v3.17.2", 2026-11-03T09:30:55Z) — the upstream
  HEAD re-verified at fork time. The earlier candidate `a60ba6a7` is tag
  `v3.17.1` and remains available for comparison.
- Pin tag on the fork: `upstream-pin-a9fe401` (annotated, carries the
  verification record in its message).
- Upstream tags restored to the fork: `v3.14.3`, `v3.15.1`, `v3.17.1`.

## Reproduce the verification

```bash
git fetch origin && git fetch upstream --tags

git rev-parse origin/main upstream/main main      # all three: a9fe401e…
git rev-parse 'origin/main^{tree}' 'upstream/main^{tree}'
#   both: e4e4c38936b992469ddade0defc28ff6ba636622  (tree-hash equality)
git diff --stat upstream/main origin/main          # empty

node apps/domain-workspace-host/scripts/verify-upstream-integrity.mjs   # exit 0
```

## Re-sync routine (upstream moves daily)

The upstream repository is sync-bot driven; `main` advances almost every day.
After every upstream advance:

1. `git fetch upstream --tags`
2. confirm `ahead_by: 0` for the product branch vs the new upstream HEAD
   (the additive commits rebase cleanly onto any baseline — they touch no
   upstream files);
3. rebase the milestone branch onto the new HEAD, re-run the integrity
   verifier (now against the new baseline recorded in
   `src/config.cjs::BASELINE_COMMIT`), re-run the app, push.
