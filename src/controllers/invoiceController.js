import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Student from '../models/Student.js'; // adjust path as needed
import {  PAYMENT_STATUS } from '../config/constants.js';

// Load environment variables
dotenv.config();

/**
 * Invoice Controller
 * Handles invoice-related operations including email sending
 */

const router = express.Router();

/**
 * GET /api/v1/invoices
 * Get all invoices
 */
router.get('/', (req, res) => {
  // TODO: Implement invoice retrieval logic
  res.json({
    success: true,
    message: 'Invoices endpoint - implement invoice retrieval logic',
    data: [],
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/v1/invoices/:id
 * Get invoice by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id;
    // console.log("Fetching invoice with ID:", invoiceId);

    // Find student by invoiceLink (or _id if that's what you want)
    const student = await Student.findOne({ invoiceLink: invoiceId }).lean();
    // console.log(student.paymentStatus)
    if (!student || student.paymentStatus !== PAYMENT_STATUS.SUCCESS) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found or payment not completed",
        timestamp: new Date().toISOString()
      });
    }

    // Build invoice response
    res.json({
      success: true,
      invoice: {
        id: student._id,
        invoiceNumber: student.invoiceNumber,
        createdAt: student.createdAt,
        programName: student.programName,
        programPriceINR: student.programPriceINR,
        programDuration: student.programDuration,
        selectedAddonNames: student.selectedAddonNames,
        addonPriceINR: student.addonPriceINR,
        subtotalINR: student.subtotalINR,
        gstRate: student.gstRate,
        gstAmountINR: student.gstAmountINR,
        totalINR: student.totalINR,
        paymentStatus: student.paymentStatus,
        paymentMethod: student.paymentMethod || "Razorpay",
        paymentDate: student.paymentDate || student.createdAt,
        type: student.programType,
      },
      student: {
        fullName: student.fullName,
        email: student.email,
        primaryPhone: student.primaryPhone,
        secondaryPhone: student.secondaryPhone,
        whatsappNotifications: student.whatsappNotifications,
        residentialAddress: student.residentialAddress,
        city: student.city,
        state: student.state,
        zipCode: student.zipCode,
        country: student.country,
        dateOfBirth: student.dateOfBirth,
        highestQualification: student.highestQualification,
        specialization: student.specialization,
        currentProfession: student.currentProfession,
        currentOrganization: student.currentOrganization,
        linkedinProfile: student.linkedinProfile,
        idType: student.idType,
        idNumber: student.idNumber,
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch invoice",
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});


/**
 * POST /api/v1/invoices
 * Create new invoice
 */
router.post('/', (req, res) => {
  const invoiceData = req.body;
  
  // TODO: Implement invoice creation logic
  res.status(201).json({
    success: true,
    message: 'Invoice created - implement invoice creation logic',
    data: invoiceData,
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/v1/invoices/send
 * Send invoice via email
 */


router.post('/send', async (req, res) => {
  try {
    const { studentEmail, invoiceLink } = req.body;

    // Validate required fields
    if (!studentEmail || !invoiceLink) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: studentEmail, invoiceLink'
      });
    }

    // Fetch student by invoiceLink
    const student = await Student.findOne({ invoiceLink }).lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Generate invoice URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:8000';
    const invoiceUrl = `${process.env.FRONTEND_URL}/invoice/${invoiceLink}`;

    // Email template
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: studentEmail,
      subject: `Invoice ${student.invoiceNumber} - SIRTIFAI Programme`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #FC4C03; color: white; padding: 20px; text-align: center;">
            <h1>SIRTIFAI</h1>
            <h2>Payment Confirmation & Invoice</h2>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Dear ${student.fullName},</p>
            
            <p>Thank you for your payment! Your enrollment has been confirmed.</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Payment Details:</h3>
              <p><strong>Invoice Number:</strong> ${student.invoiceNumber}</p>
              <p><strong>Program:</strong> ${student.programName}</p>
              <p><strong>Duration:</strong> ${student.programDuration} months</p>

              <p><strong>Total Amount:</strong> ₹${student.totalINR.toLocaleString()}</p>
              <p><strong>Payment Status:</strong> ${student.paymentStatus}</p>
              <p><strong>Payment Date:</strong> ${new Date(student.paymentDate || student.createdAt).toLocaleDateString()}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invoiceUrl}" style="background-color: #FC4C03; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Your Invoice</a>
            </div>
            
            <p>You can access your invoice anytime using the link above.</p>
            <p>You will receive further instructions about your program shortly.</p>
            <p>If you have any questions, please contact us at support@sirtifai.com</p>
            <p>Best regards,<br>The SIRTIFAI Team</p>
          </div>
          
          <div style="background-color: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} SIRTIFAI. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Invoice email sent successfully',
      data: {
        studentEmail,
        invoiceNumber: student.invoiceNumber,
        invoiceUrl
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send invoice email',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/v1/invoices/:id
 * Update invoice
 */
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  // TODO: Implement invoice update logic
  res.json({
    success: true,
    message: `Update invoice ${id} - implement invoice update logic`,
    data: { id, ...updateData },
    timestamp: new Date().toISOString()
  });
});

/**
 * DELETE /api/v1/invoices/:id
 * Delete invoice
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // TODO: Implement invoice deletion logic
  res.json({
    success: true,
    message: `Delete invoice ${id} - implement invoice deletion logic`,
    timestamp: new Date().toISOString()
  });
});

export default router;
