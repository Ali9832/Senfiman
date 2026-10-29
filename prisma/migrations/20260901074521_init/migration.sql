-- CreateEnum
CREATE TYPE "app_role" AS ENUM ('student', 'council_member', 'admin', 'warden', 'services', 'warehouse', 'council_secretary', 'central_council');

-- CreateEnum
CREATE TYPE "building_kind" AS ENUM ('faculty', 'dorm', 'cafeteria', 'other');

-- CreateEnum
CREATE TYPE "meal_kind" AS ENUM ('lunch', 'dinner');

-- CreateEnum
CREATE TYPE "transfer_status" AS ENUM ('pending', 'approved', 'rejected', 'consumed', 'expired');

-- CreateEnum
CREATE TYPE "transfer_type" AS ENUM ('send', 'request');

-- CreateEnum
CREATE TYPE "locker_status" AS ENUM ('pending_payment', 'pending_approval', 'approved', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "locker_plan" AS ENUM ('m1', 'm2', 'm3', 'semester');

-- CreateEnum
CREATE TYPE "locker_priority" AS ENUM ('host', 'guest');

-- CreateEnum
CREATE TYPE "qc_location" AS ENUM ('cafeteria', 'dorm', 'classroom', 'restroom');

-- CreateEnum
CREATE TYPE "uni_system" AS ENUM ('food', 'library', 'internet');

-- CreateEnum
CREATE TYPE "ticket_category" AS ENUM ('facilities', 'services', 'safety', 'admin', 'complaint');

-- CreateEnum
CREATE TYPE "ticket_priority" AS ENUM ('critical', 'high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "ticket_status" AS ENUM ('submitted', 'pending_warden', 'assigned', 'awaiting_student_time', 'in_progress', 'needs_items', 'items_requested', 'items_ready', 'completed', 'closed', 'reopened', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "complaint_kind" AS ENUM ('complaint', 'criticism', 'suggestion');

-- CreateEnum
CREATE TYPE "complaint_status" AS ENUM ('open', 'in_review', 'resolved', 'rejected');

-- CreateEnum
CREATE TYPE "item_request_status" AS ENUM ('requested', 'fulfilled', 'cancelled');

-- CreateEnum
CREATE TYPE "inspection_type" AS ENUM ('classroom', 'hallway', 'restroom');

-- CreateEnum
CREATE TYPE "faculty_reservation_status" AS ENUM ('active', 'cancelled');

-- CreateTable
CREATE TABLE "users" (
    "id" CHAR(36) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" CHAR(36) NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "student_code" VARCHAR(191),
    "faculty" TEXT,
    "major" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resident_building_id" CHAR(36),

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" CHAR(36) NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "role" "app_role" NOT NULL,
    "faculty" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buildings" (
    "id" CHAR(36) NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "kind" "building_kind" NOT NULL,
    "capacity" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_transfers" (
    "id" CHAR(36) NOT NULL,
    "sender_id" CHAR(36) NOT NULL,
    "receiver_id" CHAR(36),
    "receiver_student_code" TEXT NOT NULL,
    "receiver_last_name" TEXT NOT NULL,
    "meal_date" DATE NOT NULL,
    "meal_kind" "meal_kind" NOT NULL,
    "meal_name" TEXT,
    "transfer_type" "transfer_type" NOT NULL DEFAULT 'send',
    "status" "transfer_status" NOT NULL DEFAULT 'pending',
    "qr_token" VARCHAR(191) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "consumed_at" TIMESTAMP(3),
    "consumed_by" CHAR(36),

    CONSTRAINT "meal_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_menu_cache" (
    "id" CHAR(36) NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "week_start" DATE NOT NULL,
    "payload" JSONB NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "food_menu_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locker_reservations" (
    "id" CHAR(36) NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "locker_number" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "plan" "locker_plan" NOT NULL,
    "price" INTEGER NOT NULL,
    "status" "locker_status" NOT NULL DEFAULT 'pending_payment',
    "receipt_path" TEXT,
    "reviewer_id" CHAR(36),
    "reviewer_note" TEXT,
    "starts_at" DATE,
    "ends_at" DATE,
    "payment_deadline" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "building_id" CHAR(36),
    "priority_tier" "locker_priority",

    CONSTRAINT "locker_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locker_bans" (
    "id" CHAR(36) NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "reason" TEXT NOT NULL,
    "banned_until" TIMESTAMP(3) NOT NULL,
    "created_by" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locker_bans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_inspections" (
    "id" CHAR(36) NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "faculty_id" VARCHAR(191) NOT NULL,
    "inspection_type" "inspection_type" NOT NULL,
    "location_value" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "details" JSONB NOT NULL,
    "custom_items" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faculty_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_lockers" (
    "id" CHAR(36) NOT NULL,
    "faculty_id" VARCHAR(191) NOT NULL,
    "number" INTEGER NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faculty_lockers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculty_locker_reservations" (
    "id" CHAR(36) NOT NULL,
    "locker_id" CHAR(36) NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "status" "faculty_reservation_status" NOT NULL DEFAULT 'active',
    "reserved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "faculty_locker_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qc_inspections" (
    "id" CHAR(36) NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "building_id" CHAR(36),
    "location_type" "qc_location" NOT NULL,
    "location_value" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "overall_rating" SMALLINT,
    "notes" TEXT,
    "photo_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qc_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" CHAR(36) NOT NULL,
    "created_by" CHAR(36) NOT NULL,
    "building_id" CHAR(36),
    "room_no" TEXT,
    "category" "ticket_category" NOT NULL,
    "priority_suggested" "ticket_priority" NOT NULL DEFAULT 'medium',
    "priority_final" "ticket_priority",
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ticket_status" NOT NULL DEFAULT 'submitted',
    "warden_id" CHAR(36),
    "assigned_to" CHAR(36),
    "sla_due_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "satisfaction" SMALLINT,
    "satisfaction_note" TEXT,
    "reopen_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_events" (
    "id" CHAR(36) NOT NULL,
    "ticket_id" CHAR(36) NOT NULL,
    "actor_id" CHAR(36),
    "action" TEXT NOT NULL,
    "from_status" "ticket_status",
    "to_status" "ticket_status",
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_comments" (
    "id" CHAR(36) NOT NULL,
    "ticket_id" CHAR(36) NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "body" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_schedules" (
    "id" CHAR(36) NOT NULL,
    "ticket_id" CHAR(36) NOT NULL,
    "proposed_by" CHAR(36),
    "proposed_at" TIMESTAMP(3) NOT NULL,
    "student_confirmed" BOOLEAN,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_attachments" (
    "id" CHAR(36) NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_requests" (
    "id" CHAR(36) NOT NULL,
    "ticket_id" CHAR(36) NOT NULL,
    "requested_by" CHAR(36) NOT NULL,
    "items" JSONB NOT NULL,
    "notes" TEXT,
    "status" "item_request_status" NOT NULL DEFAULT 'requested',
    "fulfilled_by" CHAR(36),
    "fulfilled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" CHAR(36) NOT NULL,
    "created_by" CHAR(36),
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "kind" "complaint_kind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "complaint_status" NOT NULL DEFAULT 'open',
    "assigned_secretary" CHAR(36),
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" CHAR(36) NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "ticket_id" CHAR(36),
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kb_articles" (
    "id" CHAR(36) NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ticket_category" NOT NULL DEFAULT 'facilities',
    "content" TEXT NOT NULL,
    "tags" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "author_id" CHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kb_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "university_credentials" (
    "id" CHAR(36) NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "system" "uni_system" NOT NULL,
    "username" TEXT NOT NULL,
    "password_encrypted" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "university_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_loans" (
    "id" CHAR(36) NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "loan_date" DATE,
    "due_date" DATE NOT NULL,
    "returned" BOOLEAN NOT NULL DEFAULT false,
    "external_id" TEXT,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "library_loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internet_usage" (
    "user_id" CHAR(36) NOT NULL,
    "used_mb" BIGINT NOT NULL DEFAULT 0,
    "total_mb" BIGINT NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internet_usage_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" CHAR(36) NOT NULL,
    "user_id" CHAR(36) NOT NULL,
    "endpoint" VARCHAR(191) NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth_key" TEXT NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_student_code_key" ON "profiles"("student_code");

-- CreateIndex
CREATE INDEX "profiles_resident_building_id_idx" ON "profiles"("resident_building_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_key" ON "user_roles"("user_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "buildings_name_key" ON "buildings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "meal_transfers_qr_token_key" ON "meal_transfers"("qr_token");

-- CreateIndex
CREATE INDEX "meal_transfers_sender_id_idx" ON "meal_transfers"("sender_id");

-- CreateIndex
CREATE INDEX "meal_transfers_receiver_id_idx" ON "meal_transfers"("receiver_id");

-- CreateIndex
CREATE INDEX "meal_transfers_consumed_by_idx" ON "meal_transfers"("consumed_by");

-- CreateIndex
CREATE UNIQUE INDEX "food_menu_cache_user_id_week_start_key" ON "food_menu_cache"("user_id", "week_start");

-- CreateIndex
CREATE INDEX "locker_reservations_user_id_idx" ON "locker_reservations"("user_id");

-- CreateIndex
CREATE INDEX "locker_reservations_reviewer_id_idx" ON "locker_reservations"("reviewer_id");

-- CreateIndex
CREATE INDEX "locker_reservations_building_id_idx" ON "locker_reservations"("building_id");

-- CreateIndex
CREATE INDEX "locker_bans_user_id_idx" ON "locker_bans"("user_id");

-- CreateIndex
CREATE INDEX "locker_bans_created_by_idx" ON "locker_bans"("created_by");

-- CreateIndex
CREATE INDEX "idx_fi_faculty" ON "faculty_inspections"("faculty_id");

-- CreateIndex
CREATE INDEX "idx_fi_user" ON "faculty_inspections"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "faculty_lockers_faculty_id_number_key" ON "faculty_lockers"("faculty_id", "number");

-- CreateIndex
CREATE INDEX "faculty_locker_reservations_locker_id_idx" ON "faculty_locker_reservations"("locker_id");

-- CreateIndex
CREATE INDEX "faculty_locker_reservations_user_id_idx" ON "faculty_locker_reservations"("user_id");

-- CreateIndex
CREATE INDEX "qc_inspections_user_id_idx" ON "qc_inspections"("user_id");

-- CreateIndex
CREATE INDEX "qc_inspections_building_id_idx" ON "qc_inspections"("building_id");

-- CreateIndex
CREATE INDEX "tickets_created_by_idx" ON "tickets"("created_by");

-- CreateIndex
CREATE INDEX "tickets_warden_id_idx" ON "tickets"("warden_id");

-- CreateIndex
CREATE INDEX "tickets_assigned_to_idx" ON "tickets"("assigned_to");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "tickets_building_id_idx" ON "tickets"("building_id");

-- CreateIndex
CREATE INDEX "ticket_events_ticket_id_idx" ON "ticket_events"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_events_actor_id_idx" ON "ticket_events"("actor_id");

-- CreateIndex
CREATE INDEX "ticket_comments_ticket_id_idx" ON "ticket_comments"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_comments_user_id_idx" ON "ticket_comments"("user_id");

-- CreateIndex
CREATE INDEX "ticket_schedules_ticket_id_idx" ON "ticket_schedules"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_schedules_proposed_by_idx" ON "ticket_schedules"("proposed_by");

-- CreateIndex
CREATE INDEX "ticket_attachments_user_id_idx" ON "ticket_attachments"("user_id");

-- CreateIndex
CREATE INDEX "item_requests_ticket_id_idx" ON "item_requests"("ticket_id");

-- CreateIndex
CREATE INDEX "item_requests_requested_by_idx" ON "item_requests"("requested_by");

-- CreateIndex
CREATE INDEX "item_requests_fulfilled_by_idx" ON "item_requests"("fulfilled_by");

-- CreateIndex
CREATE INDEX "item_requests_status_idx" ON "item_requests"("status");

-- CreateIndex
CREATE INDEX "complaints_created_by_idx" ON "complaints"("created_by");

-- CreateIndex
CREATE INDEX "complaints_assigned_secretary_idx" ON "complaints"("assigned_secretary");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_ticket_id_idx" ON "notifications"("ticket_id");

-- CreateIndex
CREATE INDEX "kb_articles_author_id_idx" ON "kb_articles"("author_id");

-- CreateIndex
CREATE UNIQUE INDEX "university_credentials_user_id_system_key" ON "university_credentials"("user_id", "system");

-- CreateIndex
CREATE INDEX "idx_library_loans_user_due" ON "library_loans"("user_id", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions"("user_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_resident_building_id_fkey" FOREIGN KEY ("resident_building_id") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_transfers" ADD CONSTRAINT "meal_transfers_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_transfers" ADD CONSTRAINT "meal_transfers_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_transfers" ADD CONSTRAINT "meal_transfers_consumed_by_fkey" FOREIGN KEY ("consumed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_menu_cache" ADD CONSTRAINT "food_menu_cache_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locker_reservations" ADD CONSTRAINT "locker_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locker_reservations" ADD CONSTRAINT "locker_reservations_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locker_reservations" ADD CONSTRAINT "locker_reservations_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locker_bans" ADD CONSTRAINT "locker_bans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locker_bans" ADD CONSTRAINT "locker_bans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_inspections" ADD CONSTRAINT "faculty_inspections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_locker_reservations" ADD CONSTRAINT "faculty_locker_reservations_locker_id_fkey" FOREIGN KEY ("locker_id") REFERENCES "faculty_lockers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_locker_reservations" ADD CONSTRAINT "faculty_locker_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_inspections" ADD CONSTRAINT "qc_inspections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qc_inspections" ADD CONSTRAINT "qc_inspections_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_warden_id_fkey" FOREIGN KEY ("warden_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_events" ADD CONSTRAINT "ticket_events_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_events" ADD CONSTRAINT "ticket_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_schedules" ADD CONSTRAINT "ticket_schedules_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_schedules" ADD CONSTRAINT "ticket_schedules_proposed_by_fkey" FOREIGN KEY ("proposed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_attachments" ADD CONSTRAINT "ticket_attachments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_requests" ADD CONSTRAINT "item_requests_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_requests" ADD CONSTRAINT "item_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_requests" ADD CONSTRAINT "item_requests_fulfilled_by_fkey" FOREIGN KEY ("fulfilled_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_assigned_secretary_fkey" FOREIGN KEY ("assigned_secretary") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kb_articles" ADD CONSTRAINT "kb_articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_credentials" ADD CONSTRAINT "university_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internet_usage" ADD CONSTRAINT "internet_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
