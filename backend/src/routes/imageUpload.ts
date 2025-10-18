import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadTeamMemberImage } from '../controllers/imageUploadController';
import { authMiddleware } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimit';

const router = Router();

// Configure multer for temporary file storage
// Files will be processed and moved by the controller
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Temporary storage
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'temp-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter - only allow image files
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem são permitidos (JPEG, PNG, WebP)'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max (before compression)
  fileFilter,
});

// POST /api/upload/team-member - Upload and compress team member image
router.post('/team-member', uploadLimiter, authMiddleware, upload.single('image'), uploadTeamMemberImage);

export default router;
