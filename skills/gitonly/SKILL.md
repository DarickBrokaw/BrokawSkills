---
name: gitonly
description: Run safe git maintenance only for the current Codex session's worktree and branch, preserving all local work, committing and pushing the current branch, merging it into dev and the primary main/master branch, syncing with GitHub, and cleaning only that branch/worktree when safe.
---

# Git Only

Use this skill when the user invokes `gitonly`, `/gitonly`, or asks for the same git hygiene workflow as gitall but only for the current session's worktree and branch.

## Mission

Clean up only the current worktree and current branch:
- preserve local work first
- commit dirty changes on the current branch
- fetch, pull, push, and sync with GitHub
- merge the current branch into dev
- merge dev into the primary branch
- make dev and primary point to the same commit
- delete only the current feature branch or current extra worktree when that is safe
- leave unrelated worktrees and unrelated branches untouched

## Branch Rules

- Current branch is the branch checked out in the current Codex workspace.
- Primary branch means the remote `origin` HEAD branch when available; otherwise prefer `main`, then `master`.
- Dev branch means `dev-master` if it exists locally or remotely; otherwise `dev`; otherwise create `dev` from primary.
- If the current branch is dev or primary, sync only those branches and do not invent a feature-branch cleanup step.

## Non-Negotiable Safety

- Lose no work. This outranks cleanup speed.
- Before any commit, merge, deletion, prune, or branch switch, create a safety folder under `C:\Users\daric\.codex\git-safety\<repo>-gitonly-<yyyyMMdd-HHmmss>`.
- Capture at minimum:
  - `git status --short --branch`
  - `git worktree list --porcelain`
  - `git branch -vv`
  - `git branch -r -vv`
  - `git stash list`
  - `git remote -v`
  - `git show-ref`
  - `git log --oneline --decorate --graph --all -n 200`
  - a committed-ref bundle with `git bundle create all-refs.bundle --all`
  - unstaged and staged binary diffs for the current worktree
  - untracked file list for the current worktree
- Never use `git reset --hard`, `git clean`, `git checkout --`, `git branch -D`, or force-push unless the user explicitly asks inside the current turn.
- If the current worktree is dirty, stage normal tracked/untracked changes with `git add -A` and create a preservation commit before integrating. Do not include ignored files unless the user explicitly asked.
- If committing fails because hooks/tests fail, stop and report the blocker instead of bypassing hooks.
- Do not touch unrelated worktrees or unrelated branches except as needed to update dev and primary.

## Workflow

1. Resolve repository root, origin URL, current worktree path, current branch, primary branch, and dev branch.
2. Confirm GitHub CLI account context with `gh auth status` when `gh` exists. If private repo access fails, check account mismatch before changing remotes.
3. Create the safety folder and capture all safety artifacts before making changes.
4. Run `git fetch --all --prune --tags --prune-tags`.
5. If current branch is detached, create a named safety branch before committing.
6. If current worktree is dirty, `git add -A`, commit with `chore: preserve <branch> before gitonly`, then push that branch.
7. Pull/update dev and primary using normal merge-based sync. Avoid rebasing shared branches unless the repo already requires it.
8. If current branch is not dev or primary, merge current branch into dev and push dev.
9. Merge dev into primary and push primary.
10. Fast-forward or merge dev back to primary's final commit so dev and primary point to the same commit, then push dev again.
11. Run repo checks that are obvious from `AGENTS.md`, package scripts, or project docs when they are cheap and relevant. At minimum run `git diff --check` and `git diff --cached --check`.
12. Delete the current feature branch locally and remotely only if its tip is reachable from both final dev and final primary and it is no longer checked out.
13. Remove the current worktree only if it is not the active Codex workspace path. If removing it would break the active session, leave it clean and report that cleanup is intentionally deferred.
14. Run `git remote prune origin`, `git maintenance run --auto`, `git fsck --connectivity-only --no-dangling`, and `git count-objects -vH`.
15. Finish by reporting:
   - current branch handled
   - primary branch and dev branch
   - final commit IDs
   - safety folder path
   - pushes completed
   - branch/worktree cleanup performed or deferred
   - checks run
   - any blockers or skipped deletions

## Stop Conditions

Stop and report instead of forcing through when:
- a merge conflict occurs
- dirty changes cannot be committed normally
- GitHub auth or permissions are ambiguous
- primary/dev branch identity is ambiguous after inspection
- the current branch is not reachable from both dev and primary after attempted integration
- deleting the current branch/worktree would break the active Codex workspace
