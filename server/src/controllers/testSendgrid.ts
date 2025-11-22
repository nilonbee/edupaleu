import { Request, Response } from 'express';
import { StatusCodes } from "http-status-codes";
import { sendGridTestMail } from "../utils/sendgrid";

export const sendMail = async (req: Request, res: Response) => {
    try {
        await sendGridTestMail();
        res.status(StatusCodes.OK).json({ message: "Email sent successfully" });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: "Failed to send email"
        });
    }
}