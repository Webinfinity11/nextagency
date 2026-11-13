-- CreateEnum
CREATE TYPE "Category" AS ENUM ('identity', 'digital');

-- CreateEnum
CREATE TYPE "CoverKind" AS ENUM ('gradient', 'image', 'video');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleKa" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "summaryKa" TEXT NOT NULL DEFAULT '',
    "summaryEn" TEXT NOT NULL DEFAULT '',
    "feelingKa" TEXT NOT NULL DEFAULT '',
    "feelingEn" TEXT NOT NULL DEFAULT '',
    "introKa" TEXT NOT NULL DEFAULT '',
    "introEn" TEXT NOT NULL DEFAULT '',
    "category" "Category" NOT NULL,
    "year" INTEGER NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "coverKind" "CoverKind" NOT NULL DEFAULT 'gradient',
    "coverSrc" TEXT,
    "coverPoster" TEXT,
    "coverAspect" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "toneA" TEXT NOT NULL DEFAULT '#d9d9d9',
    "toneB" TEXT NOT NULL DEFAULT '#8a8a8a',
    "blocks" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_published_order_idx" ON "Project"("published", "order");
