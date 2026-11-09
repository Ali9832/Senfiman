CREATE TABLE "dorm_rooms" (
  "id" CHAR(36) NOT NULL,
  "building_id" CHAR(36) NOT NULL,
  "number" VARCHAR(100) NOT NULL,
  "floor" VARCHAR(100) NOT NULL,
  "capacity" INTEGER NOT NULL CHECK ("capacity" > 0),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dorm_rooms_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "dorm_rooms_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "dorm_rooms_building_id_number_key" ON "dorm_rooms"("building_id", "number");

CREATE TABLE "dorm_room_inspections" (
  "id" CHAR(36) NOT NULL,
  "room_id" CHAR(36) NOT NULL,
  "user_id" CHAR(36) NOT NULL,
  "results" JSONB NOT NULL,
  "details" JSONB NOT NULL,
  "custom_items" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dorm_room_inspections_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "dorm_room_inspections_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "dorm_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "dorm_room_inspections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "dorm_room_inspections_room_id_created_at_idx" ON "dorm_room_inspections"("room_id", "created_at");
CREATE INDEX "dorm_room_inspections_user_id_idx" ON "dorm_room_inspections"("user_id");
