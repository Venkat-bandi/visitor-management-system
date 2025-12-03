import PreApprovedAdmin from '../models/PreApprovedAdmin.js';
import PreApprovedSecurity from '../models/PreApprovedSecurity.js';
import Visitor from '../models/Visitor.js'; // ADD THIS IMPORT

// @desc    Add admin emails
// @route   POST /api/admin/add-admin-emails
// @access  Public
export const addAdminEmails = async (req, res) => {
  try {
    console.log('🔐 Add Admin Emails - Request received');
    console.log('📦 Request body:', req.body);

    const { emails } = req.body;

    if (!emails || !Array.isArray(emails)) {
      console.log('❌ Invalid emails array');
      return res.status(400).json({ 
        success: false,
        message: 'Emails array is required' 
      });
    }

    console.log('📧 Processing admin emails:', emails);

    const results = [];
    
    for (const email of emails) {
      if (!email.trim()) {
        console.log('⚠️ Skipping empty email');
        continue;
      }

      const emailLower = email.toLowerCase().trim();
      console.log('🔍 Processing admin email:', emailLower);

      try {
        const existing = await PreApprovedAdmin.findOne({ email: emailLower });
        if (existing) {
          console.log('⚠️ Admin email already exists:', emailLower);
          results.push({ email: emailLower, status: 'already_exists' });
          continue;
        }

        console.log('💾 Saving admin email to database:', emailLower);
        await PreApprovedAdmin.create({
          email: emailLower,
          used: false
        });

        console.log('✅ Admin email saved:', emailLower);
        results.push({ email: emailLower, status: 'added' });
      } catch (error) {
        console.error('❌ Error saving admin email:', error);
        results.push({ email: emailLower, status: 'error', error: error.message });
      }
    }

    console.log('🎯 Admin emails final results:', results);
    res.json({
      success: true,
      message: 'Admin emails processed successfully',
      results
    });

  } catch (error) {
    console.error('💥 Add admin emails error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
};

// @desc    Add security emails
// @route   POST /api/admin/add-security-emails
// @access  Public
export const addSecurityEmails = async (req, res) => {
  try {
    console.log('🔐 Add Security Emails - Request received');
    console.log('📦 Full request body:', req.body);

    const { securityEmails } = req.body;

    console.log('📧 Extracted securityEmails:', securityEmails);

    if (!securityEmails || !Array.isArray(securityEmails)) {
      console.log('❌ Invalid securityEmails array');
      return res.status(400).json({ 
        success: false,
        message: 'Security emails array is required' 
      });
    }

    if (securityEmails.length === 0) {
      console.log('❌ Empty securityEmails array');
      return res.status(400).json({ 
        success: false,
        message: 'At least one security email is required' 
      });
    }

    console.log('🔍 Processing security emails:', securityEmails);

    const results = [];
    
    for (const email of securityEmails) {
      if (!email || !email.trim()) {
        console.log('⚠️ Skipping empty email');
        continue;
      }

      const emailLower = email.toLowerCase().trim();
      console.log('🔍 Processing security email:', emailLower);

      try {
        // Check if email already exists
        const existing = await PreApprovedSecurity.findOne({ email: emailLower });
        if (existing) {
          console.log('⚠️ Security email already exists:', emailLower);
          results.push({ email: emailLower, status: 'already_exists' });
          continue;
        }

        console.log('💾 Saving security email to database:', emailLower);
        
        // Save to database with required field
        await PreApprovedSecurity.create({
          email: emailLower,
          addedByAdmin: 'admin@system.com', // REQUIRED FIELD
          used: false
        });

        console.log('✅ Security email saved successfully:', emailLower);
        results.push({ email: emailLower, status: 'added' });

      } catch (dbError) {
        console.error('❌ Database error for email', emailLower, ':', dbError);
        results.push({ email: emailLower, status: 'error', error: dbError.message });
      }
    }

    console.log('🎯 Security emails final results:', results);

    // Check if any emails were successfully added
    const addedEmails = results.filter(result => result.status === 'added');
    if (addedEmails.length === 0) {
      console.log('❌ No emails were added');
      return res.status(400).json({
        success: false,
        message: 'No security emails were added. They may already exist or there was an error.',
        results
      });
    }

    console.log('✅ Security emails processed successfully');
    res.json({
      success: true,
      message: `Security emails processed successfully. Added ${addedEmails.length} email(s).`,
      results
    });

  } catch (error) {
    console.error('💥 Add security emails error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message 
    });
  }
};

// @desc    Get dashboard data
// @route   GET /api/admin/dashboard
// @access  Public
export const getDashboardData = async (req, res) => {
  try {
    console.log('📊 Dashboard data request');
    
    // FIXED: Get visitor statistics instead of security email statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const currentHour = new Date();
    currentHour.setHours(currentHour.getHours() - 1);

    console.log('🔍 Fetching visitor statistics...');
    
    // Get visitor statistics
    const totalToday = await Visitor.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    const pendingToday = await Visitor.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
      status: 'pending'
    });
    
    const approvedToday = await Visitor.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
      status: 'approved'
    });
    
    const rejectedToday = await Visitor.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
      status: 'rejected'
    });
    
    const currentHourCount = await Visitor.countDocuments({
      createdAt: { $gte: currentHour }
    });

    console.log('📊 Visitor stats:', {
      total: totalToday,
      pending: pendingToday,
      approved: approvedToday,
      rejected: rejectedToday,
      currentHour: currentHourCount
    });

    const dashboardData = {
      stats: {
        total: totalToday,
        pending: pendingToday,
        approved: approvedToday,
        rejected: rejectedToday,
        currentHour: currentHourCount
      },
      lastUpdated: new Date()
    };

    console.log('✅ Sending dashboard data with visitor statistics');
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// @desc    Get visitors with filters
// @route   GET /api/admin/visitors
// @access  Public
export const getVisitors = async (req, res) => {
  try {
    console.log('👥 Visitors data request');
    
    const { startDate, endDate, status, search, page = 1, limit = 10 } = req.query;
    
    console.log('🔍 Query parameters:', {
      startDate, endDate, status, search, page, limit
    });

    // Build filter object
    let filter = {};
    
    // Date filter
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      };
    } else {
      // If no dates provided, show today's data
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      filter.createdAt = {
        $gte: today,
        $lt: tomorrow
      };
    }
    
    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { visitorName: { $regex: search, $options: 'i' } },
        { visitorPhone: { $regex: search, $options: 'i' } },
        { ownerName: { $regex: search, $options: 'i' } },
        { flatNo: { $regex: search, $options: 'i' } },
        { bikeNumber: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('🔍 Final filter:', filter);

    // Get visitors with pagination
    const visitors = await Visitor.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await Visitor.countDocuments(filter);

    console.log(`✅ Found ${visitors.length} visitors out of ${total} total`);
    
    res.json({
      success: true,
      data: visitors,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('❌ Get visitors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// @desc    Export visitors
// @route   GET /api/admin/export
// @access  Public
export const exportVisitors = async (req, res) => {
  try {
    console.log('📤 Export visitors request');
    
    const { startDate, endDate, status, format = 'csv' } = req.query;
    
    // Build filter (same as getVisitors)
    let filter = {};
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    const visitors = await Visitor.find(filter).sort({ createdAt: -1 });
    
    console.log(`📤 Exporting ${visitors.length} visitors in ${format} format`);
    
    // Simple CSV export
    if (format === 'csv') {
      const csvHeaders = 'Name,Phone,Owner,Flat,Status,Bike Number,Date\n';
      const csvData = visitors.map(visitor => 
        `"${visitor.visitorName}","${visitor.visitorPhone}","${visitor.ownerName}","${visitor.flatNo}","${visitor.status}","${visitor.bikeNumber || ''}","${visitor.createdAt}"`
      ).join('\n');
      
      const csv = csvHeaders + csvData;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=visitors-${startDate || 'all'}-to-${endDate || 'all'}.csv`);
      return res.send(csv);
    }
    
    // JSON export
    res.json({
      success: true,
      data: visitors,
      exportedAt: new Date(),
      total: visitors.length
    });
    
  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};