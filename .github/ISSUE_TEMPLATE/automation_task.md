---
name: Automation Task
about: Plan and approve an automation-friendly change.
title: "[Automation] <short goal>"
labels: automation
---

## Goal
Describe the outcome you want (1-2 sentences).

## Constraints
List constraints such as folders to avoid, dependencies to keep, or time limits.

## Files likely involved
- `path/to/file`

## Expected behavior
Describe how to verify the change works (tests, manual checks, acceptance criteria).

## Risk level
- [ ] Low (UI copy, styling, docs)
- [ ] Medium (logic changes without data migrations)
- [ ] High (data migrations, auth, payments)

## Rollback plan
Describe how to revert if the change is not correct.
