import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { validateConfig } from './config';
import { taskController } from './controllers/task.controller';
import { meetingController } from './controllers/meeting.controller';
import { evaluationController } from './controllers/evaluation.controller';
import { taskWorkflowController } from './controllers/task-workflow.controller';

// Validate environment configuration
try {
  validateConfig();
} catch (error) {
  console.error('Configuration Error:', error);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'JobSim AI Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes

// Task Generation Routes
app.post('/api/tasks/generate', (req, res) => taskController.generateTasks(req, res));
app.post('/api/tasks/generate-and-save', (req, res) => taskController.generateAndSaveTasks(req, res));
app.post('/api/tasks/balance-catalog', (req, res) => taskController.balanceTaskCatalog(req, res));

// Meeting Simulation Routes
app.post('/api/meetings/generate', (req, res) => meetingController.generateMeeting(req, res));
app.post('/api/meetings/generate-series', (req, res) => meetingController.generateMeetingSeries(req, res));

// Evaluation Routes
app.post('/api/evaluations/evaluate', (req, res) => evaluationController.evaluateSubmission(req, res));
app.post('/api/evaluations/batch', (req, res) => evaluationController.batchEvaluate(req, res));
app.post('/api/evaluations/quick-score', (req, res) => evaluationController.quickScore(req, res));

// Task Workflow Routes
app.post('/api/workflow/tasks/start', (req, res) => taskWorkflowController.startTask(req, res));
app.post('/api/workflow/submissions/evaluate', (req, res) => taskWorkflowController.evaluateSubmission(req, res));
app.post('/api/workflow/meetings/evaluate', (req, res) => taskWorkflowController.evaluateMeeting(req, res));
app.post('/api/workflow/tasks/complete', (req, res) => taskWorkflowController.completeTask(req, res));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║       JobSim AI Workflow Engine            ║
║         Running on port ${PORT}              ║
╠════════════════════════════════════════════╣
║  Task Generation:                          ║
║  - POST /api/tasks/generate                ║
║  - POST /api/tasks/generate-and-save       ║
║  - POST /api/tasks/balance-catalog         ║
║                                            ║
║  Meetings:                                 ║
║  - POST /api/meetings/generate             ║
║  - POST /api/meetings/generate-series      ║
║                                            ║
║  Evaluations:                              ║
║  - POST /api/evaluations/evaluate          ║
║  - POST /api/evaluations/batch             ║
║  - POST /api/evaluations/quick-score       ║
║                                            ║
║  Task Workflow:                            ║
║  - POST /api/workflow/tasks/start          ║
║  - POST /api/workflow/submissions/evaluate ║
║  - POST /api/workflow/meetings/evaluate    ║
║  - POST /api/workflow/tasks/complete       ║
║                                            ║
║  Health:                                   ║
║  - GET  /health                            ║
╚════════════════════════════════════════════╝
  `);
});

export default app;
