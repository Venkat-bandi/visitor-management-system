import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter with SSL fix
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false  // SSL certificate fix
  }
});

// Test email configuration
export const testEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
};

// Send visitor approval email to owner
export const sendVisitorApprovalEmail = async (ownerEmail, ownerName, visitorData, approvalToken) => {
  try {
    const approveLink = `${process.env.SERVER_URL}/api/visitors/approve/${approvalToken}`;
    const rejectLink = `${process.env.SERVER_URL}/api/visitors/reject/${approvalToken}`;

    // Visitor image URL
    const visitorImageUrl = visitorData.visitorImage 
      ? `${process.env.SERVER_URL}/uploads/${visitorData.visitorImage}`
      : null;

    // Bike number information
    const bikeInfo = visitorData.bikeNumber && visitorData.bikeNumber !== '-' 
      ? `<p><strong>🛵 Bike Number:</strong> ${visitorData.bikeNumber}</p>`
      : '<p><strong>🛵 Bike Number:</strong> Not provided</p>';

    // Visitor image in email
    const visitorImageHtml = visitorImageUrl 
      ? `<div style="text-align: center; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
           <p style="margin: 0 0 10px 0; font-weight: bold;">📸 Visitor Photo:</p>
           <img src="${visitorImageUrl}" alt="Visitor Photo" style="max-width: 300px; border-radius: 8px; border: 3px solid #007bff;" />
         </div>`
      : '<p><strong>📸 Visitor Photo:</strong> Not available</p>';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Visitor Approval Request</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Visitor Details:</h3>
          <p><strong>👤 Visitor Name:</strong> ${visitorData.visitorName}</p>
          <p><strong>📞 Visitor Phone:</strong> ${visitorData.visitorPhone}</p>
          <p><strong>🏠 Visitor Address:</strong> ${visitorData.visitorAddress}</p>
          ${visitorData.visitorEmail ? `<p><strong>📧 Visitor Email:</strong> ${visitorData.visitorEmail}</p>` : ''}
          ${bikeInfo}
          <p><strong>🎯 Purpose:</strong> Visiting ${ownerName} at Flat ${visitorData.flatNo}, ${visitorData.floor}</p>
        </div>

        ${visitorImageHtml}

        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>⚠️ Action Required:</strong> Please approve or reject this visitor request within 24 hours.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${approveLink}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-right: 10px; font-weight: bold;">
            ✅ Approve Visitor
          </a>
          <a href="${rejectLink}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            ❌ Reject Visitor
          </a>
        </div>

        <div style="text-align: center; color: #6c757d; font-size: 0.9rem; margin-top: 30px;">
          <p>This email was sent from your Visitor Management System</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Visitor Management System" <${process.env.EMAIL_USER}>`,
      to: ownerEmail,
      subject: `Visitor Approval Request - ${visitorData.visitorName}`,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Visitor approval email sent to:', ownerEmail);
    return result;
  } catch (error) {
    console.error('❌ Error sending approval email:', error);
    throw error;
  }
};

// Send status update email to security
export const sendStatusUpdateEmail = async (securityEmail, visitorName, status, ownerName, flatNo) => {
  try {
    const statusColors = {
      approved: '#28a745',
      rejected: '#dc3545'
    };

    const statusTexts = {
      approved: 'APPROVED',
      rejected: 'REJECTED'
    };

    const mailOptions = {
      from: `"Visitor Management System" <${process.env.EMAIL_USER}>`,
      to: securityEmail,
      subject: `Visitor Request ${statusTexts[status]} - ${visitorName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Visitor Request ${statusTexts[status]}</h2>
          
          <div style="background: ${statusColors[status]}; color: white; padding: 15px; border-radius: 5px; text-align: center; margin: 15px 0;">
            <h3 style="margin: 0;">REQUEST ${statusTexts[status]}</h3>
          </div>

          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0;">Details:</h3>
            <p><strong>Visitor Name:</strong> ${visitorName}</p>
            <p><strong>Status:</strong> <span style="color: ${statusColors[status]};">${statusTexts[status]}</span></p>
            <p><strong>Approved/Rejected By:</strong> ${ownerName}</p>
            <p><strong>Flat No:</strong> ${flatNo}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <p style="color: #666; font-size: 14px;">
            Please check the dashboard for more details.
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Status update email sent to security: ${status}`);
    return result;
  } catch (error) {
    console.error('❌ Error sending status email:', error);
    throw error;
  }
};

export default transporter;