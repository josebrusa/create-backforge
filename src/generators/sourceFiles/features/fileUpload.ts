import { ProjectConfig } from '../../../types.js';
import fs from 'fs-extra';
import path from 'path';

export async function generateFileUpload(
  controllersDir: string,
  servicesDir: string,
  routesDir: string,
  validatorsDir: string,
  config: ProjectConfig
): Promise<void> {
  // File upload service
  const fileUploadServiceContent = `import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { config as envConfig } from '../config/env.js';
${config.fileStorage === 's3' ? `import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';` : ''}
import { logger } from '../utils/logger.js';

${config.fileStorage === 's3' ? `const s3Client = new S3Client({
  region: envConfig.AWS_REGION,
  credentials: envConfig.AWS_ACCESS_KEY_ID && envConfig.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: envConfig.AWS_ACCESS_KEY_ID,
    secretAccessKey: envConfig.AWS_SECRET_ACCESS_KEY,
  } : undefined,
});` : ''}

const allowedTypes = envConfig.ALLOWED_FILE_TYPES.split(',').map(t => t.trim());

${config.fileStorage === 's3' ? `const storage = multerS3({
  s3: s3Client,
  bucket: envConfig.AWS_S3_BUCKET || '',
  acl: 'public-read',
  key: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, \`uploads/\${uniqueSuffix}-\${file.originalname}\`);
  },
});` : `const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), envConfig.UPLOAD_DIR);
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, \`\${uniqueSuffix}-\${file.originalname}\`);
  },
});`}

export const upload = multer({
  storage,
  limits: {
    fileSize: envConfig.MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(\`File type \${file.mimetype} not allowed. Allowed types: \${allowedTypes.join(', ')}\`));
    }
  },
});

export interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  ${config.fileStorage === 's3' ? `location: string;` : `path: string;`}
}

export const fileUploadService = {
  async deleteFile(filename: string): Promise<void> {
    try {
      ${config.fileStorage === 's3' ? `if (envConfig.AWS_S3_BUCKET) {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: envConfig.AWS_S3_BUCKET,
          Key: filename,
        }));
      }` : `const filePath = path.join(process.cwd(), envConfig.UPLOAD_DIR, filename);
      await fs.remove(filePath);`}
      logger.info(\`File deleted: \${filename}\`);
    } catch (error) {
      logger.error(\`Error deleting file \${filename}:\`, error);
      throw error;
    }
  },
};
`;

  await fs.writeFile(path.join(servicesDir, 'fileUpload.service.ts'), fileUploadServiceContent);

  // File upload controller
  const fileUploadControllerContent = `import { Request, Response } from 'express';
import { upload, UploadedFile, fileUploadService } from '../services/fileUpload.service.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Upload a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Invalid file type or size
 */
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    throw new AppError(400, 'No file uploaded');
  }

  const file = req.file as unknown as UploadedFile;
  
  res.status(200).json({
    status: 'success',
    data: {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      ${config.fileStorage === 's3' ? `url: file.location,` : `url: \`/api/files/\${file.filename}\`,`}
    },
  });
};

/**
 * @swagger
 * /api/files/{filename}:
 *   delete:
 *     summary: Delete a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 */
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  const { filename } = req.params;
  
  await fileUploadService.deleteFile(filename);
  
  res.status(200).json({
    status: 'success',
    message: 'File deleted successfully',
  });
};

/**
 * @swagger
 * /api/files/{filename}:
 *   get:
 *     summary: Get a file
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File retrieved successfully
 *       404:
 *         description: File not found
 */
export const getFile = async (req: Request, res: Response): Promise<void> => {
  const { filename } = req.params;
  ${config.fileStorage === 's3' ? `// For S3, redirect to the S3 URL
  // In production, you might want to generate a signed URL
  res.status(404).json({
    status: 'error',
    message: 'Direct file access not available for S3. Use the URL from upload response.',
  });` : `const path = require('path');
  const fs = require('fs-extra');
  const { config } = require('../config/env.js');
  
  const filePath = path.join(process.cwd(), config.UPLOAD_DIR, filename);
  
  if (!(await fs.pathExists(filePath))) {
    res.status(404).json({
      status: 'error',
      message: 'File not found',
    });
    return;
  }
  
  res.sendFile(filePath);`}
};
`;

  await fs.writeFile(path.join(controllersDir, 'fileUpload.controller.ts'), fileUploadControllerContent);

  // File upload routes
  const fileUploadRoutesContent = `import { Router } from 'express';
import { uploadFile, deleteFile, getFile } from '../controllers/fileUpload.controller.js';
import { upload } from '../services/fileUpload.service.js';
${config.includeAuth ? `import { authenticate } from '../middlewares/auth.js';` : ''}

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: File upload and management endpoints
 */
${config.includeAuth ? `router.post('/upload', authenticate, upload.single('file'), uploadFile);
router.delete('/:filename', authenticate, deleteFile);` : `router.post('/upload', upload.single('file'), uploadFile);
router.delete('/:filename', deleteFile);`}
router.get('/:filename', getFile);

export { router as fileUploadRoutes };
`;

  await fs.writeFile(path.join(routesDir, 'fileUpload.routes.ts'), fileUploadRoutesContent);
}
