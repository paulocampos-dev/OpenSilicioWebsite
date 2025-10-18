import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { BadRequestError } from '../errors/AppError';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

/**
 * Upload and compress team member image
 * - Resizes to max width 800px (maintains aspect ratio)
 * - Compresses to 90% quality JPEG
 * - Converts all formats to JPEG for consistency
 */
export const uploadTeamMemberImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new BadRequestError('Nenhum arquivo enviado');
  }

  const tempFilePath = req.file.path;
  const fileExtension = '.jpg'; // Always save as JPEG
  const uniqueFilename = `team-${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
  const outputPath = path.join('uploads', 'team-members', uniqueFilename);

  try {
    // Process image with Sharp
    await sharp(tempFilePath)
      .resize(800, null, { // Max width 800px, height auto
        withoutEnlargement: true, // Don't enlarge small images
        fit: 'inside'
      })
      .jpeg({ quality: 90 }) // Convert to JPEG with 90% quality
      .toFile(outputPath);

    // Delete temporary file
    await fs.unlink(tempFilePath);

    // Generate URL for the compressed image
    const imageUrl = `${process.env.API_URL || 'http://localhost:3001'}/uploads/team-members/${uniqueFilename}`;

    // Get file stats for the compressed image
    const stats = await fs.stat(outputPath);

    res.json({
      filename: uniqueFilename,
      url: imageUrl,
      size: stats.size,
      originalSize: req.file.size,
      compressionRatio: ((1 - stats.size / req.file.size) * 100).toFixed(2) + '%',
    });
  } catch (error) {
    // Clean up temporary file if processing failed
    try {
      await fs.unlink(tempFilePath);
    } catch {}

    console.error('Error processing image:', error);
    throw new BadRequestError('Erro ao processar imagem');
  }
});
