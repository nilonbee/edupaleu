import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dashboardRoutes from './routes/dashboardRoutes';
import productRoutes from './routes/productRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import applicationRoutes from './routes/applicationRoutes';
import universityRoutes from './routes/universityRoutes';
import applicationStatusRoutes from './routes/applicationStatusRoutes';
import studentRoutes from './routes/studentRoutes';
import seedRoutes from './routes/seeds'

import { errorHandlerMiddleware } from './middleware/error-handler';
import { notFoundMiddleware } from './middleware/not-found';

// CONFIGURATIONS
dotenv.config();

const app = express();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(morgan('common'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

// Cookie parser with JWT secret for signed cookies
app.use(cookieParser(process.env.JWT_SECRET));

//ROUTES
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/products', productRoutes);
app.use('/applications', applicationRoutes)
app.use('/application-status', applicationStatusRoutes)
app.use('/universities', universityRoutes)
app.use('/students', studentRoutes)
app.use('/seed', seedRoutes);



// Error handling
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

//SERVER
const port = process.env.PORT || 3001;

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
})