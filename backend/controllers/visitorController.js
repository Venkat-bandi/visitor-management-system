import Visitor from '../models/Visitor.js';
import Token from '../models/Token.js';
import crypto from 'crypto';
import { sendVisitorApprovalEmail, sendStatusUpdateEmail } from '../utils/emailService.js';
import fs from 'fs';

// ML DETECTION FUNCTION - BASE64 VERSION
const detectBikeNumberFromImage = async (imagePath) => {
  try {
    console.log('🖼️ Calling ML service for bike number detection...');
    console.log('📁 Image path:', imagePath);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.log('❌ Image file not found:', imagePath);
      return "-";
    }

    // Read the image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    console.log('🔗 Calling ML service at: http://localhost:5001/detect-bike-number');
    
    // Convert to base64 and send as JSON
    const base64Image = imageBuffer.toString('base64');
    
    const response = await fetch('http://localhost:5001/detect-bike-number', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${base64Image}`
      })
    });
    
    console.log('📡 ML Service Response Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('🤖 ML Detection Result:', result);
      
      if (result.success && result.bike_number && result.bike_number !== "-") {
        console.log('✅ Using detected bike number:', result.bike_number);
        return result.bike_number;
      } else {
        console.log('❌ ML detection failed or no number found');
      }
    } else {
      console.log('❌ ML Service response not OK:', response.status);
    }
    
    return "-";
  } catch (error) {
    console.error('🚫 ML Service Error:', error.message);
    return "-";
  }
};

// CREATE VISITOR FUNCTION
export const createVisitor = async (req, res) => {
  try {
    const {
      visitorName,
      visitorPhone,
      visitorAddress,
      visitorEmail,
      ownerName,
      ownerEmail,
      ownerMobile,
      flatNo,
      floor,
      bikeNumber
    } = req.body;

    console.log('📸 Checking for uploaded files...');
    console.log('📁 Uploaded files:', req.files);
    console.log('🔢 Manual bike number input:', bikeNumber);

    // ML DETECTION
    let finalBikeNumber = bikeNumber || "-";
    
    if (req.files?.bikeNumberImage?.[0]) {
      console.log('🖼️ Bike image found, calling ML service...');
      const bikeImagePath = req.files.bikeNumberImage[0].path;
      console.log('📁 Bike image path:', bikeImagePath);
      
      const detectedBikeNumber = await detectBikeNumberFromImage(bikeImagePath);
      console.log('🔢 ML Detected Bike Number:', detectedBikeNumber);
      
      if (detectedBikeNumber && detectedBikeNumber !== "-") {
        finalBikeNumber = detectedBikeNumber;
        console.log('✅ Using ML detected number:', finalBikeNumber);
      } else {
        console.log('ℹ️ Using manual bike number:', finalBikeNumber);
      }
    } else {
      console.log('❌ No bike image uploaded, using manual input:', finalBikeNumber);
    }

    console.log('💾 Saving visitor with bike number:', finalBikeNumber);

    const visitor = await Visitor.create({
      visitorName,
      visitorPhone,
      visitorAddress,
      visitorEmail,
      ownerName,
      ownerEmail,
      ownerMobile,
      flatNo,
      floor,
      bikeNumber: finalBikeNumber,
      visitorImage: req.files?.visitorImage?.[0]?.filename || '',
      bikeNumberImage: req.files?.bikeNumberImage?.[0]?.filename || '',
      capturedBy: req.user.id,
      securityEmail: req.user.email
    });

    const approvalToken = crypto.randomBytes(32).toString('hex');
    
    await Token.create({
      token: approvalToken,
      visitorId: visitor._id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await sendVisitorApprovalEmail(ownerEmail, ownerName, visitor, approvalToken);

    res.status(201).json({
      success: true,
      message: 'Visitor created successfully. Approval email sent to owner.',
      data: visitor
    });
  } catch (error) {
    console.error('❌ Error in createVisitor:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Visitor already exists with similar details'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating visitor: ' + error.message
    });
  }
};

// REST OF YOUR FUNCTIONS
export const approveVisitor = async (req, res) => {
  try {
    const { token } = req.params;

    const tokenDoc = await Token.findOne({ token }).populate('visitorId');
    
    if (!tokenDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const visitor = await Visitor.findByIdAndUpdate(
      tokenDoc.visitorId,
      {
        status: 'approved',
        approvedAt: new Date()
      },
      { new: true }
    );

    await sendStatusUpdateEmail(
      visitor.securityEmail,
      visitor.visitorName,
      'approved',
      visitor.ownerName,
      visitor.flatNo
    );

    await Token.findByIdAndDelete(tokenDoc._id);

    res.status(200).json({
      success: true,
      message: 'Visitor approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving visitor: ' + error.message
    });
  }
};

export const rejectVisitor = async (req, res) => {
  try {
    const { token } = req.params;

    const tokenDoc = await Token.findOne({ token }).populate('visitorId');
    
    if (!tokenDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const visitor = await Visitor.findByIdAndUpdate(
      tokenDoc.visitorId,
      {
        status: 'rejected',
        rejectedAt: new Date()
      },
      { new: true }
    );

    await sendStatusUpdateEmail(
      visitor.securityEmail,
      visitor.visitorName,
      'rejected',
      visitor.ownerName,
      visitor.flatNo
    );

    await Token.findByIdAndDelete(tokenDoc._id);

    res.status(200).json({
      success: true,
      message: 'Visitor rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting visitor: ' + error.message
    });
  }
};

export const getSecurityVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find({ capturedBy: req.user.id })
      .sort({ createdAt: -1 })
      .populate('capturedBy', 'name email');

    res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching visitors: ' + error.message
    });
  }
};