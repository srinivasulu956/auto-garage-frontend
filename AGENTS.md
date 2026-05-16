# AGENTS.md

Guidelines for AI coding agents working in this repository.

## Prime Directive

This is a production React application. Preserve existing behavior, UI, routes, API contracts, authentication flow, and business logic unless the repository owner explicitly asks for a behavior change.

## Never Perform Git Operations

Agents must never run git commands, including:

- commit, push, pull, merge, rebase
- checkout, switch, branch, tag
- reset, revert, stash, fetch, remote
- force push or amend commits

Git history, branching, deployments, and repository configuration are managed only by the repository owner.

## Allowed Actions

Agents may:

- Read project files
- Create, edit, and delete project files when requested
- Run build, lint, and test commands
- Install local project dependencies when needed and approved
- Suggest git commands in plain text only

## Safety Rules

- Never access or modify `.env*` or secrets files.
- Never modify `AGENTS.md` unless explicitly instructed.
- Never install global packages without approval.
- Never run commands affecting remote repositories.
- Prefer small, incremental changes over broad rewrites.
- Do not refactor risky flows without explaining the risk first.

## Refactor Rules

- Keep UI appearance the same.
- Keep existing functionality the same.
- Keep existing API behavior the same.
- Keep existing routes the same.
- Keep existing business logic the same.
- Prefer moving/extracting over rewriting.
- Keep feature changes isolated.
- Validate after every meaningful change.

## Workflow

1. Understand the current structure before editing.
2. Explain the intended change when the work is non-trivial.
3. Make small changes directly in the working directory.
4. Run relevant validation when possible.
5. Summarize changed files and any manual checks needed.
6. Leave all git operations to the owner.

## Documentation

Use the docs in `docs/` as the source of truth for frontend architecture, folder structure, SCSS conventions, and reusable component guidelines.
