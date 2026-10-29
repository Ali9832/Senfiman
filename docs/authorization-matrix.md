# Authorization migration matrix

This document maps the former Supabase RLS rules to server-side checks. It is a
delivery checklist: a frontend role gate never replaces an API authorization
check.

| Resource | Former access rule | Required server-side rule |
| --- | --- | --- |
| Profiles | A user reads and updates their own profile; administrators manage roles. | Derive the target user from the authenticated session for self-service endpoints. Require `admin` for any other user's profile or roles. |
| Buildings | Any authenticated user reads; only `admin` writes. | Require authentication for reads and `admin` for create, update, and delete. |
| Meal transfers | Sender or receiver can read/update; either may create their own side. | Always filter by `senderId` or `receiverId` from the session. Validate state transitions and weekly-transfer limits in a transaction. |
| Locker reservations/bans | User sees own; council staff can review; only council staff ban. | Scope user endpoints to the session ID. Require `council_member`, `admin`, or `central_council` as appropriate for review/ban actions. |
| Faculty lockers | Authenticated users view lockers; only central council manages the grid. | Require authentication for reads; require `central_council` (or explicitly approved equivalent) for grid management. Enforce one active reservation per locker and user transactionally. |
| QC inspections | Owner, council member, or admin reads; owner creates. | Set `userId` from the session. Restrict cross-user lists to council/admin roles. |
| Tickets | Creator, assignee, warden, admin, central council, secretary, and relevant warehouse staff have limited visibility. | Implement `canViewTicket(actor, ticket)` in a service and use it for every ticket child resource. Never accept creator/actor IDs from the client. |
| Ticket comments | Ticket-visible users read; internal comments limited to staff/admin; authors update/delete own, admin can delete. | Reuse `canViewTicket`; apply an internal-comment filter unless the session has staff/admin permissions. |
| Schedules/items | Ticket visibility controls schedules. Item requests are visible to requester, warehouse, warden, and admin. | Check ticket visibility plus the role-specific item-request rules on each action. |
| Complaints | Owner sees non-anonymous submissions; secretary/admin see all; authenticated users create anonymous or own named complaints. | Make the creator null only on server-approved anonymous creation. Require `council_secretary` or `admin` for triage/status updates. |
| Notifications | User reads and marks only their own notifications. | Filter updates and reads by session user ID; do not accept `userId` from the client. |
| Knowledge base | Authenticated users see published articles; central council manages all. | Filter unpublished articles unless the session has `central_council`/approved admin capability. |
| University credentials, food cache, loans, quota | Owner-only. | Scope every query and mutation to session user ID. Encrypt stored university passwords before persistence. |
| Storage | Uploads live under the owner ID; permitted staff can view relevant files. | Build object keys server-side and authorize download/upload through ticket/locker/QC ownership services. Do not trust client-supplied storage paths. |

## Former database behaviour to move into services/jobs

- Ticket defaults, SLA deadlines, event logging, and notifications: ticket service.
- Overdue ticket escalation RPC: scheduled server job.
- Food/library/internet Edge Functions: authenticated server integrations with
  encrypted credential access.
- `updated_at` triggers: Prisma `@updatedAt` fields or explicit updates.
- Partial unique reservation indexes and weekly meal-transfer limit: PostgreSQL
  constraints where possible plus transaction-level validation.
