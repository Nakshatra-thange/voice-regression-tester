-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "adapterType" TEXT NOT NULL DEFAULT 'generic_json',
ADD COLUMN     "requestConfig" JSONB;
