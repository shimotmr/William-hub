---
on:
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: read

safe-outputs:
  add-comment:
    max: 1
---

# PR Review Agent

Review the pull request changes for this Next.js + Tailwind + TypeScript project (William Hub).

## Instructions

1. Review all changed files for:
   - TypeScript type errors or unsafe patterns
   - Tailwind CSS issues (missing responsive breakpoints, hardcoded px values)
   - Next.js best practices (server vs client components, Image optimization)
   - Security issues (exposed secrets, XSS)
   - Performance concerns (unnecessary re-renders, large imports)

2. Project-specific rules:
   - No emoji in UI code — must use SVG icons
   - Dark theme base: bg-[#080a0f]
   - Responsive: desktop-first with mobile breakpoints

3. Post a comment with:
   - ✅ What looks good
   - ⚠️ Suggestions
   - ❌ Blocking issues

Be concise. Focus on real issues, skip style nitpicks.
