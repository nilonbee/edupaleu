"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const applicationRoutes_1 = __importDefault(require("./routes/applicationRoutes"));
const universityRoutes_1 = __importDefault(require("./routes/universityRoutes"));
const applicationStatusRoutes_1 = __importDefault(require("./routes/applicationStatusRoutes"));
const studentRoutes_1 = __importDefault(require("./routes/studentRoutes"));
const error_handler_1 = require("./middleware/error-handler");
const not_found_1 = require("./middleware/not-found");
// CONFIGURATIONS
dotenv_1.default.config();
const app = (0, express_1.default)();
// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);
// Middleware
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
app.use(helmet_1.default.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use((0, morgan_1.default)('common'));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
// Cookie parser with JWT secret for signed cookies
app.use((0, cookie_parser_1.default)(process.env.JWT_SECRET));
//ROUTES
app.use('/api/v1/auth', authRoutes_1.default);
app.use('/api/v1/users', userRoutes_1.default);
app.use('/dashboard', dashboardRoutes_1.default);
app.use('/products', productRoutes_1.default);
app.use('/applications', applicationRoutes_1.default);
app.use('/application-status', applicationStatusRoutes_1.default);
app.use('/universities', universityRoutes_1.default);
app.use('/students', studentRoutes_1.default);
// Error handling
app.use(not_found_1.notFoundMiddleware);
app.use(error_handler_1.errorHandlerMiddleware);
//SERVER
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
