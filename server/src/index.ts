import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fileUpload from 'express-fileupload'
import cookieParser from 'cookie-parser';
import dashboardRoutes from './routes/dashboardRoutes';
import productRoutes from './routes/productRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import applicationRoutes from './routes/applicationRoutes';
import universityRoutes from './routes/universityRoutes';
import applicationStatusRoutes from './routes/applicationStatusRoutes';
import studentRoutes from './routes/studentRoutes';
import seedRoutes from './routes/seedRoutes';
import fileUploadRoutes from './routes/fileUploadRoutes';
import enquiryRoutes from './routes/enquiryRoutes';
import countryRoutes from './routes/countryRoutes';

import { errorHandlerMiddleware } from './middleware/error-handler';
import { notFoundMiddleware } from './middleware/not-found';

// CONFIGURATIONS
dotenv.config();

// Validate environment variables on startup
import { validateEnv } from './config/validateEnv';
try {
  validateEnv();
  console.log('✅ Environment variables validated');
} catch (error: any) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

const app = express();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Middleware
// app.use(express.static('/public'));
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(morgan('common'));
app.use(bodyParser.json());
//file upload package invoke
app.use(fileUpload())
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
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/applications', applicationRoutes)
app.use('/api/v1/application-status', applicationStatusRoutes)
app.use('/api/v1/universities', universityRoutes)
app.use('/api/v1/students', studentRoutes)
app.use('/api/v1/seed', seedRoutes)
app.use('/api/v1/file-upload', fileUploadRoutes)
app.use('/api/v1/enquiries', enquiryRoutes)
app.use('/api/v1/countries', countryRoutes)



// Error handling
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

//SERVER
const port = Number(process.env.PORT) || 3001;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port: ${port}`);
})