import express from 'express';
import { getDashboardData, getVisitors, exportVisitors, addAdminEmails, addSecurityEmails } from '../controllers/adminController.js';

const router = express.Router();

// NO AUTHENTICATION
router.get('/dashboard', getDashboardData);
router.get('/visitors', getVisitors);
router.get('/export', exportVisitors);
router.post('/add-admin-emails', addAdminEmails);
router.post('/add-security-emails', addSecurityEmails);

export default router;