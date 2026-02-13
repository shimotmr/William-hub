---
on:
  workflow_run:
    workflows: ["Vercel"]
    types: [completed]
    branches:
      - main

permissions:
  contents: read
  actions: read

safe-outputs:
  create-issue:
    max: 1
---

# CI Failure Investigator

When a Vercel build fails, investigate and create a helpful issue.

## Instructions

1. Check the completed workflow run status
2. If the build **failed**:
   - Read the build logs to find the error
   - Identify the root cause (which file, which line)
   - Create an issue titled "[CI] Build failure: <brief description>"
   - Include: error message, failing file(s), suggested fix, commit SHA
3. If the build **succeeded**:
   - Do nothing

Keep issues clear and actionable.
