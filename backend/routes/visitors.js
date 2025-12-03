import express from 'express';
import { createVisitor, approveVisitor, rejectVisitor, getSecurityVisitors } from '../controllers/visitorController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadVisitorImages } from '../middleware/upload.js';

const router = express.Router();

router.post('/', protect, authorize('security'), uploadVisitorImages, createVisitor);
router.get('/security', protect, authorize('security'), getSecurityVisitors);
router.get('/approve/:token', approveVisitor);
router.get('/reject/:token', rejectVisitor);

export default router;