---
description: Automates the process of adding, committing, and pushing changes to GitHub.
---

# Git Save Workflow

This workflow streamlines the process of saving your work to GitHub.

## 1. Check Status
First, look at what has changed.
- Run `git status` to see modified files.

## 2. Stage Changes
- Run `git add .` to stage all changes.
// turbo
- Run `git status` again to confirm staging.

## 3. Commit
- Generate a concise, conventional commit message based on the `git status` output (e.g., "feat: add login page", "fix: resolve mime type error").
- Run `git commit -m "YOUR_MESSAGE_HERE"`.

## 4. Push
- Run `git push origin main` (or the current branch).

## 5. Verify
- Run `git log -n 1` to confirm the commit was pushed.
