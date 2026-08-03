-- CreateEnum
CREATE TYPE "TestMode" AS ENUM ('SCRIPTED', 'GOAL_DRIVEN');

-- CreateEnum
CREATE TYPE "TurnRole" AS ENUM ('CALLER', 'AGENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('PENDING', 'RUNNING', 'PASSED', 'FAILED', 'ERROR');

-- CreateEnum
CREATE TYPE "AssertionType" AS ENUM ('CONTAINS_KEYWORD', 'NOT_CONTAINS_KEYWORD', 'REGEX_MATCH', 'TOOL_CALLED', 'TOOL_NOT_CALLED', 'MAX_TURNS', 'MAX_LATENCY_MS', 'LLM_JUDGE');

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baseUrl" TEXT NOT NULL,
    "authHeader" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "mode" "TestMode" NOT NULL,
    "personaPrompt" TEXT NOT NULL,
    "scriptedTurns" JSONB,
    "goal" TEXT,
    "maxTurns" INTEGER NOT NULL DEFAULT 8,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assertions" (
    "id" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "type" "AssertionType" NOT NULL,
    "config" JSONB NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assertions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_runs" (
    "id" TEXT NOT NULL,
    "testCaseId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'PENDING',
    "configVersion" TEXT,
    "isBaseline" BOOLEAN NOT NULL DEFAULT false,
    "totalLatencyMs" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "test_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turns" (
    "id" TEXT NOT NULL,
    "testRunId" TEXT NOT NULL,
    "turnNumber" INTEGER NOT NULL,
    "role" "TurnRole" NOT NULL,
    "content" TEXT NOT NULL,
    "toolCalls" JSONB,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assertion_results" (
    "id" TEXT NOT NULL,
    "testRunId" TEXT NOT NULL,
    "assertionId" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "actualValue" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assertion_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "test_runs_testCaseId_agentId_isBaseline_idx" ON "test_runs"("testCaseId", "agentId", "isBaseline");

-- AddForeignKey
ALTER TABLE "assertions" ADD CONSTRAINT "assertions_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_testCaseId_fkey" FOREIGN KEY ("testCaseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turns" ADD CONSTRAINT "turns_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assertion_results" ADD CONSTRAINT "assertion_results_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assertion_results" ADD CONSTRAINT "assertion_results_assertionId_fkey" FOREIGN KEY ("assertionId") REFERENCES "assertions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
