-- Ticket attachments live in PostgreSQL so the API can run on serverless hosting.
ALTER TABLE "ticket_attachments" ADD COLUMN "data" BYTEA;
