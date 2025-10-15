import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { BadRequestError } from '../errors/AppError';

export const uploadFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new BadRequestError('Nenhum arquivo enviado');
  }

  const fileUrl = `${process.env.API_URL || 'http://localhost:3001'}/uploads/${req.file.filename}`;

  res.json({
    filename: req.file.filename,
    url: fileUrl,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

