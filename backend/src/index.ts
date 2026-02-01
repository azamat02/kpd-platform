import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import groupRoutes from './routes/groupRoutes';
import evaluationPeriodRoutes from './routes/evaluationPeriodRoutes';
import evaluationRoutes from './routes/evaluationRoutes';
import groupScoreRoutes from './routes/groupScoreRoutes';
import kpiRoutes from './routes/kpiRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/evaluation-periods', evaluationPeriodRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/group-scores', groupScoreRoutes);
app.use('/api/kpis', kpiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
