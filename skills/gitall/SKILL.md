---
name: gitall
description: Run full safe git maintenance for the entire current repository, including all worktrees and branches, preserving all work, committing dirty branches, syncing with GitHub, merging everything into dev and the primary main/master branch, then pruning extra worktrees and branches only after integration is verified.
---

# Git All

Use this skill when the user invokes `gitall`, `/gitall`, or asks for whole-repository git maintenance across every worktree and branch.

## Mission

Make the whole repository clean, synced, and minimal:
- preserve every bit of work first
- commit dirty worktree changes on their current branches
- fetch, pull, push, and sync with GitHub
- merge all non-primary work into the dev branch
- merge dev into the primary branch
- make dev and primary point to the same commit
- remove extra worktrees and local/remote branches only after they are proven integrated
- finish with clean status, connectivity checks, and a concise report

## Branch Rules

- Primary branch means the remote `origin` HEAD branch when available; otherwise prefer `main`, then `master`.
- Dev branch means `dev-master` if it exists locally or remotely; otherwise `dev`; otherwise create `dev` from primary.
- Final state should keep only dev and primary branches. If dev and primary are the same branch in that repo, keep only that branch.
- Do not assume `main` is primary when `git remote show origin` says otherwise.

## Non-Negotiable Safety

- Lose no work. This outranks cleanup speed.
- Before any commit, merge, deletion, prune, or branch rewrite, create a safety folder under `C:\Users\daric\.codex\git-safety\<repo>-<yyyyMMdd-HHmmss>`.
- Capture at minimum:
  - `git status --short --branch` for every worktree
  - `git worktree list --porcelain`
  - `git branch -vv`
  - `git branch -r -vv`
  - `git stash list`
  - `git remote -v`
  - `git show-ref`
  - `git log --oneline --decorate --graph --all -n 300`
  - a committed-ref bundle with `git bundle create all-refs.bundle --all`
  - unstaged and staged binary diffs for every dirty worktree
  - untracked file lists for every dirty worktree
- Never use `git reset --hard`, `git clean`, `git checkout --`, `git branch -D`, or force-push unless the user explicitly asks inside the current turn.
- Use normal `git branch -d` and remote deletion only after the branch tip is reachable from both dev and primary.
- If a branch has dirty changes, stage all normal tracked/untracked changes with `git add -A` and create a preservation commit on that branch before integrating. Do not include ignored files unless the user explicitly asked.
- If committing fails because hooks/tests fail, stop cleanup for that branch and report the blocker instead of bypassing hooks.

## Workflow

1. Resolve repository root, common git dir, origin URL, primary branch, dev branch, current branch, and all worktrees.
2. Confirm GitHub CLI account context with `gh auth status` when `gh` exists. If private repo access fails, check account mismatch before changing remotes.
3. Create the safety folder and capture all safety artifacts before making changes.
4. Run `git fetch --all --prune --tags --prune-tags`.
5. For every worktree:
   - inspect status
   - if detached, create a named safety branch before committing
   - if dirty, `git add -A`, commit with `chore: preserve <branch> before gitall`, then push that branch
6. Pull/update dev and primary using normal merge-based sync. Avoid rebasing shared branches unless the repo already requires it.
7. Merge every non-dev/non-primary local and remote branch into dev. Use `--no-ff` for traceability when a merge commit is needed.
8. Push dev.
9. Merge dev into primary, then push primary.
10. Fast-forward or merge dev back to primary's final commit so dev and primary point to the same commit, then push dev again.
11. Run repo checks that are obvious from `AGENTS.md`, package scripts, or project docs when they are cheap and relevant. At minimum run `git diff --check` and `git diff --cached --check`.
12. Delete extra local and remote branches only if their tip is reachable from both final dev and final primary.
13. Remove extra worktrees only when clean and their branch has been integrated. Use `git worktree remove` first; use `git worktree prune` after.
14. Run `git remote prune origin`, `git gc`, `git maintenance run --auto`, `git fsck --connectivity-only --no-dangling`, and `git count-objects -vH`.
15. Finish by reporting:
   - primary branch and dev branch
   - final commit IDs
   - safety folder path
   - branches/worktrees merged
   - branches/worktrees removed
   - pushes completed
   - checks run
   - any blockers or skipped deletions

## Stop Conditions

Stop and report instead of forcing through when:
- a merge conflict occurs
- a dirty branch cannot be committed normally
- GitHub auth or permissions are ambiguous
- primary/dev branch identity is ambiguous after inspection
- a branch is not reachable from both dev and primary after attempted integration
- a worktree is the active session path and removing it would break the current Codex workspace
