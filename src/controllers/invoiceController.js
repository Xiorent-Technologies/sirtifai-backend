import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

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

    // TODO: Replace with your database logic
    // For now, we'll simulate finding a student record
    const mockStudent = {
      id: "student_123",
      invoiceLink: invoiceId,
      paymentStatus: "COMPLETED",
      invoiceNumber: "INV-2024-001",
      createdAt: new Date("2024-01-15"),
      programName: "Full Stack Development",
      programPrice: 500,
      programPriceINR: 50000,
      programDuration: 6,
      addonName: "Advanced React",
      addonPrice: 100,
      addonPriceINR: 10000,
      subtotal: 600,
      subtotalINR: 60000,
      gstRate: 18,
      gstAmount: 108,
      gstAmountINR: 10800,
      totalAmount: 708,
      totalINR: 70800,
      exchangeRateUsed: 100,
      paymentMethod: "Razorpay",
      paymentDate: new Date("2024-01-15"),
      type: "program",
      fullName: "John Doe",
      email: "john.doe@example.com",
      primaryPhone: "+91-9876543210",
      residentialAddress: "123 Main Street",
      city: "Mumbai",
      state: "Maharashtra",
      zipCode: "400001",
      country: "India"
    };

    // Check if invoice exists and payment is completed
    if (!mockStudent || mockStudent.paymentStatus !== "COMPLETED") {
      return res.status(404).json({
        success: false,
        error: "Invoice not found or payment not completed",
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      invoice: {
        id: mockStudent.id,
        invoiceNumber: mockStudent.invoiceNumber,
        createdAt: mockStudent.createdAt,
        programName: mockStudent.programName,
        programPrice: mockStudent.programPrice,
        programPriceINR: mockStudent.programPriceINR,
        programDuration: mockStudent.programDuration,
        addonName: mockStudent.addonName,
        addonPrice: mockStudent.addonPrice,
        addonPriceINR: mockStudent.addonPriceINR,
        subtotal: mockStudent.subtotal,
        subtotalINR: mockStudent.subtotalINR,
        gstRate: mockStudent.gstRate,
        gstAmount: mockStudent.gstAmount,
        gstAmountINR: mockStudent.gstAmountINR,
        total: mockStudent.totalAmount,
        totalINR: mockStudent.totalINR,
        exchangeRate: mockStudent.exchangeRateUsed,
        paymentStatus: mockStudent.paymentStatus,
        paymentMethod: mockStudent.paymentMethod,
        paymentDate: mockStudent.paymentDate,
        type: mockStudent.type,
      },
      student: {
        fullName: mockStudent.fullName,
        email: mockStudent.email,
        primaryPhone: mockStudent.primaryPhone,
        residentialAddress: mockStudent.residentialAddress,
        city: mockStudent.city,
        state: mockStudent.state,
        zipCode: mockStudent.zipCode,
        country: mockStudent.country,
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
    const { studentEmail, studentName, invoiceLink, invoiceData } = req.body;

    // Validate required fields
    if (!studentEmail || !studentName || !invoiceLink || !invoiceData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: studentEmail, studentName, invoiceLink, invoiceData'
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
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const invoiceUrl = `${baseUrl}/invoice/${invoiceLink}`;

    // Email template
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: studentEmail,
      subject: `Invoice ${invoiceData.invoiceNumber} - SIRTIFAI Programme`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #FC4C03; color: white; padding: 20px; text-align: center;">
            <h1>SIRTIFAI</h1>
            <h2>Payment Confirmation & Invoice</h2>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Dear ${studentName},</p>
            
            <p>Thank you for your payment! Your enrollment has been confirmed.</p>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Payment Details:</h3>
              <p><strong>Invoice Number:</strong> ${invoiceData.invoiceNumber}</p>
              <p><strong>Program:</strong> ${invoiceData.programName}</p>
              <p><strong>Duration:</strong> ${invoiceData.duration} months</p>
              ${invoiceData.addonName ? `<p><strong>Add-on:</strong> ${invoiceData.addonName}</p>` : ''}
              <p><strong>Total Amount:</strong> ₹${invoiceData.total.toLocaleString()}</p>
              <p><strong>Payment Status:</strong> ${invoiceData.paymentStatus}</p>
              <p><strong>Payment Date:</strong> ${new Date(invoiceData.paymentDate).toLocaleDateString()}</p>
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
            <p>&copy; 2023 SIRTIFAI. All rights reserved.</p>
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
        invoiceNumber: invoiceData.invoiceNumber,
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
