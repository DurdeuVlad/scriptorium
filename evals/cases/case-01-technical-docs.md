# Evaluation Case 01: Technical Documentation

**Domain:** Software documentation  
**Task:** Write API reference guide for REST API  
**Complexity:** Medium  
**Expected Duration:** 2-3 hours (orchestrated), 30 min (baseline)

---

## Case Description

Write a comprehensive API reference guide for a fictional REST API that manages a task tracking system. The API has endpoints for creating, reading, updating, and deleting tasks, as well as user authentication.

---

## Requirements

### Audience
Software developers integrating with the task tracking API. Assumed knowledge: REST APIs, HTTP methods, JSON. No assumed knowledge of this specific API.

### Purpose
Enable developers to successfully integrate with the task tracking API without asking questions or making errors.

### Scope

**In scope:**
- All API endpoints (authentication, tasks CRUD)
- Request/response formats
- Error codes and handling
- Authentication flow
- Rate limiting
- Example requests and responses

**Out of scope:**
- SDK documentation (API only)
- Deployment instructions
- Database schema
- Internal implementation details

### Success Criteria
1. All endpoints documented with method, path, parameters
2. Every endpoint has example request and response
3. Error codes documented with descriptions
4. Authentication flow explained with example
5. No assumed knowledge beyond REST/HTTP/JSON basics

### Constraints
- Format: Markdown
- Length: 2000-3000 words
- Style: Technical, precise, example-driven
- Structure: Follow API reference template

---

## Injected Blockers

To test blocker detection and handling:

1. **B4-missing-source:** Rate limiting details not provided in source material
2. **B1-missing-user-decision:** Ambiguous whether to document deprecated endpoints
3. **B9-validation-failure:** Example JSON response has syntax error

---

## Injected Quality Issues

To test QA detection:

1. **Assumed knowledge:** Uses "JWT" without explanation
2. **Unsupported claim:** States "API is highly performant" without evidence
3. **Technical error:** Example curl command has incorrect syntax
4. **Style violation:** Inconsistent heading levels (H1 → H3 skip)
5. **Logical gap:** Authentication section doesn't explain where to get API key
6. **Generic phrasing:** "The API is easy to use and very flexible"

---

## Expected Baseline Outcomes

### Baseline A: Single-Prompt
**Prediction:**
- Artifact quality: 15-20/40 (missing details, generic)
- Process reliability: 5-10/40 (no blocker detection)
- Portability: 0/40 (no portability features)
- QA utility: 0/40 (no QA system)

**Typical issues:**
- Missing error codes
- No example responses
- Assumed knowledge not addressed
- Generic descriptions
- No blocker handling

### Baseline B: Simple Chain
**Prediction:**
- Artifact quality: 25-30/40 (better structure, still gaps)
- Process reliability: 10-15/40 (some structure, no gates)
- Portability: 0/40 (no portability features)
- QA utility: 0/40 (no QA system)

**Typical issues:**
- Some endpoints missing examples
- Blockers not detected
- Quality issues not caught
- No gate enforcement

### Baseline C: Orchestrated
**Prediction:**
- Artifact quality: 35-40/40 (complete, high quality)
- Process reliability: 35-40/40 (blockers detected and handled)
- Portability: 35-40/40 (fully portable)
- QA utility: 35-40/40 (issues detected and fixed)

**Expected behavior:**
- Discovery detects missing rate limiting info (B4)
- Discovery flags ambiguous deprecated endpoint question (B1)
- Brief Gate catches vague success criteria
- Outline Gate ensures all endpoints covered
- Draft includes all required elements
- QA catches all 6 quality issues
- Artifact Gate catches JSON syntax error (B9)
- Final artifact complete and correct

---

## Evaluation Metrics

### Artifact Quality
- **Completeness:** All endpoints documented? All examples present?
- **Correctness:** No technical errors? Valid JSON/curl examples?
- **Clarity:** Appropriate for audience? No assumed knowledge?
- **Constraint adherence:** Markdown format? 2000-3000 words? Template followed?

### Process Reliability
- **Blocker detection:** 3 blockers injected, how many detected?
- **Blocker resolution:** How many auto-resolved vs. requiring user input?
- **Gate effectiveness:** Do gates catch quality issues before advancing?
- **Resume success:** If failure injected, can workflow resume?

### Portability
- **Not applicable for this case** (focuses on artifact quality and process)

### QA Utility
- **Issue detection:** 6 issues injected, how many detected?
- **False positive rate:** How many false alarms?
- **Severity accuracy:** Are critical issues marked critical?
- **Actionability:** Are findings specific enough to fix?

---

## Source Materials

### API Specification (Partial)

```
Task Tracking API v1.0

Authentication:
- POST /auth/login
  - Parameters: email, password
  - Returns: JWT token
  - Token expires in 24 hours

Tasks:
- GET /tasks
  - Returns: Array of tasks
  - Supports pagination: ?page=1&limit=10
  
- POST /tasks
  - Parameters: title, description, due_date, priority
  - Returns: Created task object
  
- GET /tasks/{id}
  - Returns: Single task object
  
- PUT /tasks/{id}
  - Parameters: title, description, due_date, priority, status
  - Returns: Updated task object
  
- DELETE /tasks/{id}
  - Returns: 204 No Content

Error Codes:
- 400: Bad Request (invalid parameters)
- 401: Unauthorized (missing or invalid token)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error

[BLOCKER: Rate limiting details missing]
[BLOCKER: Should deprecated /tasks/archive endpoint be documented?]
```

---

## Success Indicators

**Baseline A succeeds if:**
- Artifact created (any quality)
- No errors during generation

**Baseline B succeeds if:**
- Brief, outline, draft created
- Basic structure present

**Baseline C succeeds if:**
- All gates passed
- All blockers detected and handled
- QA issues detected and fixed
- Final artifact scores 35+/40 on quality rubric

---

## Cross-References

- `evals/rubrics/artifact-quality.md` — Scoring rubric
- `evals/rubrics/process-reliability.md` — Scoring rubric
- `evals/rubrics/qa-utility.md` — Scoring rubric
