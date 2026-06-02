# Getting Started ($prepare)

**Shortcut**: `$prepare`

**Description**: Reads all files needed to obtain context for development.

## Command

`$prepare`

## Instructions

Execute the following steps to prepare for development:

1. Read the files in the `../` folder (e.g. `../golden-rules.md`, `../technical-requirements.md`) to understand the state of the project.

2. DO NOT READ any source code. Code should be read on demand depending on the needs of the user and the development flow.

3. You MUST read the `../architecture/` folder. This is critical.

4. You MUST read the `../golden-rules.md` file. This is critical.

5. Do not READ all of `../languages/` directory. Languages must be loaded during development. You do need to know what languages are available.

6. Read `../agents/README.md`, it contains a list of available Agents. Do not read or load the individual AGENTS; they should only be used when needed during development.

7. If you find missing information, ask the user.

## Notes

This workflow is optimized to load only what is necessary:
- Agent files are only loaded on demand when necessary.
- Language specific conventions are only loaded when needed.
- Source code is read on demand when working on specific workflows.
