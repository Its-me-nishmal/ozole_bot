const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const config = require('./config');
const logger = require('./utils/logger');
const { errorHandlerMiddleware } = require('./middlewares/errorHandlerMiddleware');
const { loggingMiddleware } = require('./middlewares/loggingMiddleware');
const { rateLimitMiddleware } = require('./middlewares/rateLimitMiddleware');
const messageRoutes = require('./routes/messageRoutes');
const historyRoutes = require('./routes/historyRoutes');
const userRoutes = require('./routes/userRoutes');
const statusRoutes = require('./routes/statusRoutes');
const geminiRoutes = require('./routes/geminiRoutes');
const databaseAdapter = require('./adapters/databaseAdapter');
const { connectionHandler } = require('./events/connectionHandler');

require('./events');

const app = express();

// Middlewares
app.use(cors());
const bodyParser = require('body-parser');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(rateLimitMiddleware);
app.use(loggingMiddleware);


// Routes

app.use('/gemini', geminiRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/status', statusRoutes);

// Error handling
// Start the server
const port = config.port || 3000;

async function startServer() {
  try {
    await databaseAdapter.connect();
    app.listen(port, () => {
      logger.info(`Server listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Error starting server:', error);
  }
}

startServer();
connectionHandler().catch(err => console.error("Failed to start connection handler", err));