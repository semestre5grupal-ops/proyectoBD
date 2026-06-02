# Implementation Session ($implementation-session)

**Shortcut**: `$implementation-session <feature-name>`

**Description**: Runs an implementation-focused workflow for a specific feature in the ERP system.

**Arguments:**
* `[feature-name]`: Name of the feature as specified in the created design session doc. The feature name will be found in `docs/design_sessions/`

**Preconditions:**
* The `[feature-name]` must exist with an equivalent design session doc.
* The user must have approved the design in the previous step (design session).

**Context Dependencies:**
Load the following context dependencies for the current development session.
* The design doc in `../../design_sessions/` based on the `feature-name`
* `../golden-rules.md`
* `../technical-requirements.md`

## Command

`$implementation-session <feature-name>`

## Instructions
Execute the following steps to implement a feature:

1. Activate the appropriate development agents based on the work involved:
   - Usually the `engineer` and `frontend-architect` agents are ideal.

2. Find and read the design session in `../../design_sessions/` by looking for a file matching `*-{feature-name}.md`.

3. Initialize development environment:
   - Verify dependencies (`npm install`)
   - Configure local environment variables (`.env`) for connecting to the specific microservices.

4. Implement the design:
   - Follow the implementation plan to implement the design as specified in the design record.
     - If anything is missing from the implementation plan that is in the design, ask the user for input.
   - Follow all rules in `../golden-rules.md` (no database sharing, MVC layout, etc.).
   - Follow the architecture in `../technical-requirements.md` (frontend controller/service/view layout, backend config/routes/middlewares/controllers/models layout).
   - Use JavaScript (ES6+) and Node.js standards as mapped in `../languages/README.md`.

5. Handle ambiguity:
   - If there is any ambiguity in the design, DO NOT get creative.
   - Instead, ask the user for clarification.

## Notes

This workflow should align with the same context-loading and scope discipline used by `$prepare`.
