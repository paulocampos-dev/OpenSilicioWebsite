import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const fileUrl = `${process.env.API_URL || 'http://localhost:3001'}/uploads/${req.file.filename}`;

    res.json({
      filename: req.file.filename,
      url: fileUrl,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
  }
};

