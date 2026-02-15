# API Contract Testing

This directory contains JSON Schema definitions for William Hub API endpoints.

## Schemas

- `dashboard.schema.json` - Dashboard API response schema
- `growth.schema.json` - Growth/trend data API response schema
- `knowledge-search.schema.json` - Knowledge search API response schema

## Usage

Run contract tests:

```bash
~/clawd/scripts/api_contract_test.sh [BASE_URL]
```

If no BASE_URL is provided, the script will:
1. Check if localhost:3000 is running
2. Fall back to production URL

## Test Requirements

- API endpoints must be running (local dev server or deployed)
- Responses must match the JSON Schema definitions
- All required fields must be present with correct types

## Known Issues

- `/api/growth` and `/api/knowledge/search` return 404 on production (2026-02-16)
- These routes exist in codebase but may not be deployed correctly
- All schemas validated against local API code

## Schema Validation

The test script uses ajv-cli to validate JSON responses against schemas.
Validation checks:
- Required fields presence
- Field types
- Value constraints (min/max, patterns, etc.)
