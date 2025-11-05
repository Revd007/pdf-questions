import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { pdfToQuestionsWorkflow } from './workflows/generate-questions-from-pdf-workflow';
import { textQuestionAgent } from './agents/text-question-agent';
import { pdfQuestionAgent } from './agents/pdf-question-agent';
import { pdfSummarizationAgent } from './agents/pdf-summarization-agent';
import { dtkAiAgent } from './agents/dtk-ai-agent';

export const mastra = new Mastra({
  workflows: { pdfToQuestionsWorkflow },
  agents: {
    textQuestionAgent,
    pdfQuestionAgent,
    pdfSummarizationAgent,
    dtkAiAgent,
  },
  storage: new LibSQLStore({
    // stores telemetry, evals, memory, ... into persistent file storage
    // Change to ':memory:' for in-memory only (not persistent)
    url: process.env.MASTRA_DB_URL || 'file:./mastra.db',
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: {
    default: {
      enabled: true,
    },
  },
});
