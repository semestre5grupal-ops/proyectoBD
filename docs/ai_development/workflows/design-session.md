# Design Session ($design-session)

**Shortcut**: `$design-session <feature-name>`

**Description**: Starts a focused design workflow for a specific feature of the ERP system.
**Agent:** `@architect`
**Reviewer:** `@architect-reviewer`

**Arguments:**
* `[feature-name]`: (Optional) Name of the feature. Defaults to `active-design`.

**Context Dependencies:**
Load the following context dependencies for the current development session.
* `../golden-rules.md`
* `../technical-requirements.md`

## Command

`$design-session <feature-name>`

## Instructions

1.  **Adopt Persona:** Load instructions from `../agents/architect.md`.
2.  **Setup:**
    * Determine filename: `../../design_sessions/[design-name].md`.
    * Check if file exists. If yes, read it. If no, create it.
3.  **Context Interview (Interactive):**
    * **Action:** Ask the user: *"What are the requirements for [design-name]? Please describe the input data, controllers, views, services, and expected HTTP requests."*
    * **Action:** Wait for user input.
    * **Action:** Iteratively refine the MVC boundaries and JSON schemas in the markdown file based on user answers.
4.  **Review:**
    * Validate the draft against `../golden-rules.md` (check for API encapsulation, database isolation, and proper SSO flow).
    * Ensure NO hard-coded credentials or direct database connections are proposed.
5.  **Finalize:**
    * Ask: *"Is this design ready for implementation?"*
    * **STOP.** Do not write code yet.

## Notes

This workflow should align with the same context-loading and scope discipline used by `$prepare`.
