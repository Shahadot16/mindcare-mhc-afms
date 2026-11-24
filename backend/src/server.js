import 'dotenv/config';
import http from 'node:http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './services/socket.service.js';
import { startReminderJob } from './jobs/reminder.job.js';
import Appointment from './models/Appointment.js';

const PORT = process.env.PORT || 5050;

try {
  await connectDB();
  await Appointment.syncIndexes(); // makes sure the no-double-booking index exists

  const server = http.createServer(app);
  initSocket(server);
  server.listen(PORT, () => console.log(`MHC-AFMS API + realtime running on http://localhost:${PORT}`));

  if (process.env.DISABLE_JOBS !== 'true') startReminderJob();
} catch (err) {
  console.error('Failed to start server:', err.message);
  process.exit(1);
}
