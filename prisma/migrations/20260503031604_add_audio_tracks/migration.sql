-- CreateEnum
CREATE TYPE "AudioTrackType" AS ENUM ('ORIGINAL', 'PLAYBACK', 'GUIDE', 'LESSON', 'DEMO', 'OTHER');

-- CreateEnum
CREATE TYPE "AudioTrackStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "AudioTrack" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "AudioTrackType" NOT NULL DEFAULT 'OTHER',
    "status" "AudioTrackStatus" NOT NULL DEFAULT 'DRAFT',
    "audioUrl" TEXT NOT NULL,
    "durationSec" INTEGER,
    "sizeBytes" INTEGER,
    "mimeType" TEXT,
    "songId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudioTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AudioTrack_songId_idx" ON "AudioTrack"("songId");

-- CreateIndex
CREATE INDEX "AudioTrack_status_idx" ON "AudioTrack"("status");

-- CreateIndex
CREATE INDEX "AudioTrack_type_idx" ON "AudioTrack"("type");

-- AddForeignKey
ALTER TABLE "AudioTrack" ADD CONSTRAINT "AudioTrack_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
