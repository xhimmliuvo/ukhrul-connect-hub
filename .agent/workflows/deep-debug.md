---
description: Deep debugging workflow using structured analysis and MCP tools
---

# Deep Debug Workflow

This workflow guides the agent through a rigorous debugging process, simulating a "deep thinking" approach to solve complex issues.

## 1. Context Gathering
First, understand the environment and the reported issue.

1.  **Read Project Config**:
    -   `view_file package.json` to identify dependencies and scripts.
    -   `list_dir src` (or relevant root) to understand project structure.

2.  **Analyze the Request**:
    -   If an error message is provided, identifying keywords (e.g., "cannot find module", "undefined is not a function").
    -   If a behavior is described, identify the likely components involved.

## 2. Initial Investigation & Reproduction
Attempt to reproduce or locate the issue.

1.  **Static Analysis**:
    -   Run `npm run lint` to catch syntax or type errors.
    -   Run `npm run build` to check for build-time errors.
    
    // turbo
    -   If errors are found, Capture the output.

2.  **Search for Keywords**:
    -   Use `grep_search` to find the specific error message or variable names from the issue description.
    -   Use `find_by_name` to locate files related to the feature (e.g., if the "login" is broken, search for `*login*`).

## 3. Deep Analysis (The "Thinking" Phase)
Now, analyze the gathered information.

1.  **Inspect Code**:
    -   Use `view_file` on the suspicious files found in step 2.
    -   Trace the data flow: where does the input come from? Where does it go?
    -   Check for common issues:
        -   Missing imports.
        -   Incorrect hook dependency arrays (React).
        -   Asynchronous race conditions.
        -   Typos in variable names.

2.  **Formulate Hypothesis**:
    -   Based on the code inspection, state the most likely cause of the bug.
    -   Example: "The `user` object is null when compiling the profile because the data fetch hasn't completed yet."

4.  **Logical Bug Scan**:
    -   **State Management**: Check for unnecessary re-renders, correct usage of `useEffect` dependencies, and safe state updates.
    -   **Control Flow**: Check for off-by-one errors in loops, correct condition nesting, and unreachable code.
    -   **Async Consistency**: Ensure loading states are handled, race conditions are mitigated (e.g., ignoring stale responses), and errors are caught.
    -   **Data Integrity**: Verify that inputs are validated and data transformations handle edge cases (empty arrays, null values).

5.  **Cross-Reference**:
    -   Check identifying if similar patterns exist elsewhere in the codebase that work correctly.

## 4. Implementation of Fix
Apply the solution.

1.  **Plan the Edit**:
    -   Decide exactly which lines need to change.
    -   Ensure standard coding style is followed.

2.  **Apply Changes**:
    -   Use `replace_file_content` for single blocks.
    -   Use `multi_replace_file_content` for scattered changes.

## 5. Verification
Ensure the fix works and doesn't break anything else.

1.  **Re-run Static Checks**:
    -   Run `npm run lint` again.
    -   Run `npm run build` again.

2.  **Manual Verification Instructions**:
    -   If the issue was visual or runtime-specific (and not caught by build/lint), ask the user to verify in their environment.
    -   Provide specific instructions: "Please start the dev server and navigate to the login page to verify the fix."

## 6. Documentation
-   Briefly summarize the fix in the final response.
