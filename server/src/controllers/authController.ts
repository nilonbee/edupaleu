// import { Request, Response } from 'express';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();


// const register = async (request: Request, response: Response) => {

//     const { email, password, name } = request.body;

//     //check user is already there
//     const user = await prisma.user.findUnique(email);
//     if (user) {
//         throw new Error("user is already registered")
//     }

//     //create user
//     await prisma.user.create({
//         email, password, name
//     })

//     response.status(201).json({
//         msg: ""
//     })
// }