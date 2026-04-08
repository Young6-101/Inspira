# Frontend ↔ Backend API Alignment

Last updated: 2026-04-01

Use this file as the single source of truth when aligning frontend integration with backend APIs.

## 1) API Contract Matrix

| Position (Frontend) | API Name | Function (What it does) | Method | Auth | Request Shape | Response Shape | Backend Status |
|---|---|---|---|---|---|---|---|
| src/services/authService.ts → `getAuthenticatedUser()` | Cognito: `getCurrentUser` + `fetchUserAttributes` | Read current signed-in user profile (`nickname`, `email`) | SDK call | Session-based (Amplify) | none | `{ nickname: string, email: string } \| null` | Active |
| src/services/authService.ts → `logInWithCognito(payload)` | Cognito: `signIn` | User login with email/password | SDK call | No token required before call | `{ email: string, password: string }` | success or SDK error | Active |
| src/services/authService.ts → `signUpWithCognito(payload)` | Cognito: `signUp` | Create user account with `email`, `password`, `nickname` | SDK call | No token required before call | `{ email: string, password: string, nickname: string }` | success or SDK error (includes verify-email step) | Active |
| src/services/authService.ts → `logOutFromCognito()` | Cognito: `signOut` | End user session | SDK call | Signed-in user | none | void | Active |
| src/utils/api.ts → `callApi(endpoint, body)` | Generic App API Gateway | Wrapper for backend POST calls with Bearer token | `POST` | `Authorization: Bearer <idToken>` | `endpoint: string`, `body: any` | raw `fetch` response | Active (generic) |

## 2) Where CRUD Is Right Now (Stacks + Files)

> Current status: **no backend CRUD is implemented yet** for stacks/files. Existing logic is UI/local state only.

### A) Stacks CRUD (Current Frontend Positions)

| CRUD | Position (Frontend) | Current Function | Backend Endpoint |
|---|---|---|---|
| Create | src/App.tsx → `createStack(payload)` | Adds a new stack into local React state (`setStacks`) | Missing / TBD |
| Read (list) | src/App.tsx → `stacks` state passed to `StacksPage` | Reads stacks from in-memory `initialStacks` + state | Missing / TBD |
| Read (single/open) | src/App.tsx → `openWorkspace(stackId)` | Navigates to `/workspace/:stackId` and sets current stack id | Missing / TBD |
| Update | src/App.tsx → `updateStack(id, payload)` | Updates stack name/type in local state | Missing / TBD |
| Delete | src/App.tsx → `deleteStack(id)` | Removes stack from local state | Missing / TBD |

### B) Files/Nodes CRUD (Current Frontend Positions)

| CRUD | Position (Frontend) | Current Function | Backend Endpoint |
|---|---|---|---|
| Create/Upload | src/hooks/useWorkspace.ts → `uploadFiles(files)` | Parses selected files, creates local node objects; no server upload | Missing / TBD |
| Read (list) | src/hooks/useWorkspace.ts → `nodes` state | Reads nodes from in-memory state only | Missing / TBD |
| Update (rename) | src/hooks/useWorkspace.ts → `renameNode(id, nextLabel)` | Renames node label locally | Missing / TBD |
| Update (move/position) | src/hooks/useWorkspace.ts → drag handlers (`onMouseMoveCanvas`, mouseup snap) | Updates `x`,`y` in local state | Missing / TBD |
| Delete | src/hooks/useWorkspace.ts → `removeNode(id)` | Deletes node locally (+ revoke blob URL for images) | Missing / TBD |

## 3) Recommended Backend CRUD Contract To Align

### FastAPI Naming Alignment (Use These Names)

#### Stacks Router (`/stacks`)

| Purpose | FastAPI path operation name (`operation_id`) | Route |
|---|---|---|
| Create stack | `create_stack` | `POST /stacks` |
| List stacks | `list_stacks` | `GET /stacks` |
| Get stack detail | `get_stack` | `GET /stacks/{stack_id}` |
| Update stack | `update_stack` | `PATCH /stacks/{stack_id}` |
| Delete stack | `delete_stack` | `DELETE /stacks/{stack_id}` |

#### Files Router (`/stacks/{stack_id}/files`)

| Purpose | FastAPI path operation name (`operation_id`) | Route |
|---|---|---|
| Upload file to stack | `upload_stack_file` | `POST /stacks/{stack_id}/files` |
| List files in stack | `list_stack_files` | `GET /stacks/{stack_id}/files` |
| Get file detail | `get_stack_file` | `GET /stacks/{stack_id}/files/{file_id}` |
| Update file metadata | `update_stack_file` | `PATCH /stacks/{stack_id}/files/{file_id}` |
| Update file position | `update_stack_file_position` | `PATCH /stacks/{stack_id}/files/{file_id}/position` |
| Delete file | `delete_stack_file` | `DELETE /stacks/{stack_id}/files/{file_id}` |

#### Suggested Pydantic schema names

- `StackCreateRequest`, `StackUpdateRequest`, `StackResponse`, `StackListResponse`
- `FileUploadResponse`, `FileUpdateRequest`, `FilePositionUpdateRequest`, `FileResponse`, `FileListResponse`

#### Suggested FastAPI tags

- `tags=["stacks"]` for stack routes
- `tags=["files"]` for file routes

### Stacks

| CRUD | Proposed Route | Notes |
|---|---|---|
| Create | `POST /stacks` | Body: `{ name, label }` |
| Read list | `GET /stacks` | Supports pagination/filter |
| Read single | `GET /stacks/:stackId` | For stack metadata |
| Update | `PATCH /stacks/:stackId` | Partial update `{ name?, label? }` |
| Delete | `DELETE /stacks/:stackId` | Hard or soft delete |

### Files / Nodes (within stack)

| CRUD | Proposed Route | Notes |
|---|---|---|
| Create/upload file | `POST /stacks/:stackId/files` | Multipart upload + metadata |
| Read list files | `GET /stacks/:stackId/files` | Returns file/node list |
| Read single file | `GET /stacks/:stackId/files/:fileId` | File metadata/detail |
| Update metadata | `PATCH /stacks/:stackId/files/:fileId` | Rename/type/tags |
| Update position | `PATCH /stacks/:stackId/files/:fileId/position` | Body `{ x, y }` |
| Delete file | `DELETE /stacks/:stackId/files/:fileId` | Remove file/node |

## 4) Endpoint-by-Endpoint Alignment (Fill This With Backend Team)

## 2) Endpoint-by-Endpoint Alignment (Fill This With Backend Team)

Copy one block per backend endpoint:

### Endpoint: `<name>`
- **Frontend position:** `<file path> → <function/component/hook>`
- **Backend route:** `<METHOD> <URL>`
- **Business function:** `<what user action this enables>`
- **Auth requirement:** `<none / bearer token / role-based>`
- **Request contract:**
	- Headers: `<Content-Type/Auth/etc>`
	- Body: `<JSON schema or example>`
- **Response contract:**
	- Success: `<shape>`
	- Error: `<status codes + shape>`
- **Validation rules:** `<required fields, limits, formats>`
- **Idempotency / retries:** `<yes/no + behavior>`
- **Owner:** `<frontend owner> / <backend owner>`
- **Status:** `<TBD / In Progress / Aligned / Blocked>`

## 5) Alignment Gaps / Open Questions

- [ ] Do we standardize all app endpoints behind `callApi()` or create typed API clients per domain?
- [ ] Should token use `idToken` or `accessToken` for backend authorization?
- [ ] Confirm error envelope format (for example: `{ code, message, details }`).
- [ ] Confirm pagination format for list endpoints (`page`, `limit`, `nextCursor`, etc.).

## 6) Change Log

- 2026-04-01: Initial API alignment document created from current frontend code.
- 2026-04-01: Added explicit Stacks and Files CRUD positions; marked backend endpoints as missing/TBD.
- 2026-04-01: Added concrete FastAPI operation names (`operation_id`) for stacks/files alignment.
