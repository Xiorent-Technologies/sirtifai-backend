import express from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Constants
const GST_RATE = 0.18; // 18% GST

// Helper Functions
function generateInvoiceNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
  return `SRT/INT/${dateStr}/${randomNum}`;
}

// Mock product data (replace with your actual product service)
function getProductById(productId) {
  const products = {
    'fullstack': {
      id: 'fullstack',
      name: 'Full Stack Development',
      basePrice: 500
    },
    'react': {
      id: 'react',
      name: 'Advanced React',
      basePrice: 100
    }
  };
  return products[productId] || null;
}

// Mock currency conversion (replace with your actual currency service)
async function getINRToUSDRate() {
  // Mock rate - replace with actual API call
  return 0.012; // 1 INR = 0.012 USD
}

function convertUSDToINR(usdAmount, inrToUsdRate) {
  return usdAmount / inrToUsdRate;
}

function createStandardizedPackageData(packageType, selectedProduct, selectedAddon, duration) {
  const product = getProductById(selectedProduct);
  const addon = selectedAddon ? getProductById(selectedAddon) : null;
  
  const programPrice = product ? product.basePrice * duration : 0;
  const addonPrice = addon ? addon.basePrice : 0;
  const subtotal = programPrice + addonPrice;
  
  return {
    pricing: {
      programPrice,
      addonPrice,
      subtotal
    }
  };
}

/**
 * Payment Controller
 * Handles payment-related operations including Razorpay order creation and verification
 */

const router = express.Router();

/**
 * GET /api/v1/payments
 * Get all payments
 */
router.get('/', (req, res) => {
  // TODO: Implement payment retrieval logic
  res.json({
    success: true,
    message: 'Payments endpoint - implement payment retrieval logic',
    data: [],
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/v1/payments/:id
 * Get payment by ID
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  // TODO: Implement payment retrieval by ID logic
  res.json({
    success: true,
    message: `Get payment ${id} - implement payment retrieval logic`,
    data: { id },
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/v1/payments
 * Create new payment
 */
router.post('/', (req, res) => {
  const paymentData = req.body;
  
  // TODO: Implement payment creation logic
  res.status(201).json({
    success: true,
    message: 'Payment created - implement payment creation logic',
    data: paymentData,
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/v1/payments/create-order
 * Create Razorpay order and student record
 */
router.post('/create-order', async (req, res) => {
  try {
    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });

    const { packageData, studentData, receipt } = req.body;

    console.log('Received data in create-order:', { packageData, studentData });

    if (!packageData || !studentData) {
      return res.status(400).json({
        success: false,
        error: 'Missing package data or student data',
        timestamp: new Date().toISOString()
      });
    }

    const selectedProduct = packageData?.selectedProduct || packageData?.selectedProgram;
    const selectedAddon = packageData?.selectedAddon;
    const duration = packageData?.productData?.duration || packageData?.selectedMonths || 1;
    const packageType = packageData?.type || 'program';

    // Get product details
    const product = getProductById(selectedProduct);
    const addon = selectedAddon ? getProductById(selectedAddon) : null;

    if (!product) {
      console.error('Product not found for ID:', selectedProduct);
      return res.status(400).json({
        success: false,
        error: 'Product not found',
        timestamp: new Date().toISOString()
      });
    }

    // Calculate pricing
    const standardizedData = createStandardizedPackageData(packageType, selectedProduct, selectedAddon, duration);

    const programPriceUSD = standardizedData.pricing.programPrice;
    const addOnPriceUSD = standardizedData.pricing.addonPrice;
    const subtotalUSD = standardizedData.pricing.subtotal;

    if (isNaN(programPriceUSD) || isNaN(subtotalUSD)) {
      console.error('Invalid pricing calculation:', {
        programPriceUSD,
        duration,
        addOnPriceUSD,
        subtotalUSD,
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid pricing calculation',
        timestamp: new Date().toISOString()
      });
    }

    // Currency conversion
    const inrToUsdRate = await getINRToUSDRate();
    const usdToInrRate = 1 / inrToUsdRate;
    const subtotalINR = convertUSDToINR(subtotalUSD, inrToUsdRate);
    const gstAmount = subtotalINR * GST_RATE;
    const totalAmountINR = subtotalINR + gstAmount;

    const programPriceINR = convertUSDToINR(programPriceUSD, inrToUsdRate);
    const addonPriceINR = addOnPriceUSD ? convertUSDToINR(addOnPriceUSD, inrToUsdRate) : null;

    // Create Razorpay order
    const options = {
      amount: Math.round(totalAmountINR * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    const invoiceNumber = generateInvoiceNumber();
    const invoiceLink = uuidv4();

    // Parse date of birth
    let parsedDateOfBirth;
    if (!studentData.dateOfBirth) {
      return res.status(400).json({
        success: false,
        error: 'Date of birth is required',
        timestamp: new Date().toISOString()
      });
    }

    if (
      typeof studentData.dateOfBirth === 'object' &&
      studentData.dateOfBirth.day &&
      studentData.dateOfBirth.month &&
      studentData.dateOfBirth.year
    ) {
      const { day, month, year } = studentData.dateOfBirth;
      const dateValue = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day));
      if (!isNaN(dateValue.getTime())) {
        parsedDateOfBirth = dateValue;
      } else {
        console.error('Invalid date of birth components:', studentData.dateOfBirth);
        return res.status(400).json({
          success: false,
          error: 'Invalid date of birth format',
          timestamp: new Date().toISOString()
        });
      }
    } else {
      const dateValue = new Date(studentData.dateOfBirth);
      if (!isNaN(dateValue.getTime())) {
        parsedDateOfBirth = dateValue;
      } else {
        console.error('Invalid date of birth:', studentData.dateOfBirth);
        return res.status(400).json({
          success: false,
          error: 'Invalid date of birth format',
          timestamp: new Date().toISOString()
        });
      }
    }

    // TODO: Replace with your database logic
    // For now, we'll simulate creating a student record
    const mockStudent = {
      id: `student_${Date.now()}`,
      // Personal Details
      fullName: studentData.fullName,
      dateOfBirth: parsedDateOfBirth,
      countryOfCitizenship: studentData.countryOfCitizenship,
      referralCode: studentData.referralCode || null,

      // Contact Information
      primaryPhone: studentData.primaryPhone,
      secondaryPhone: studentData.secondaryPhone || null,
      whatsappNotifications: studentData.whatsappNotifications || false,
      email: studentData.email,
      residentialAddress: studentData.residentialAddress,
      city: studentData.city,
      state: studentData.state,
      zipCode: studentData.zipCode,
      country: studentData.country,

      // Education
      highestQualification: studentData.highestQualification,
      specialization: studentData.specialization || null,

      // Professional
      currentProfession: studentData.currentProfession || null,
      currentOrganization: studentData.currentOrganization || null,
      linkedinProfile: studentData.linkedinProfile || null,

      // Identity Document
      idType: studentData.idType,
      idNumber: studentData.idNumber,

      // Program Selection
      type: packageType,
      selectedProgram: selectedProduct,
      programDuration: duration,
      programPrice: programPriceUSD,
      selectedAddon: selectedAddon || null,
      addonPrice: addOnPriceUSD || null,

      // Invoice Details
      invoiceNumber,
      programName: product.name,
      addonName: addon?.name || null,
      subtotal: subtotalUSD,
      gstRate: GST_RATE * 100, // Store as percentage
      gstAmount: subtotalUSD * GST_RATE, // GST in USD
      totalAmount: subtotalUSD * (1 + GST_RATE), // Total in USD

      // INR Calculations
      exchangeRateUsed: usdToInrRate,
      programPriceINR,
      addonPriceINR,
      subtotalINR,
      gstAmountINR: gstAmount,
      totalINR: totalAmountINR,

      // Payment Details
      paymentStatus: 'PROCESSING',
      razorpayOrderId: order.id,
      invoiceLink,

      // Confirmation
      agreedToTerms: studentData.agreedToTerms || false,
      certifiedInformation: studentData.certifiedInformation || false,
    };

    console.log('Student record created successfully:', {
      studentId: mockStudent.id,
      orderId: order.id,
      invoiceNumber,
      programName: product.name,
      addonName: addon?.name,
      totalAmountINR,
    });

    res.json({
      success: true,
      ...order,
      studentId: mockStudent.id,
      invoiceLink,
      pricing: {
        programPriceUSD,
        totalProgramPriceUSD: programPriceUSD,
        addOnPriceUSD,
        subtotalUSD,
        subtotalINR,
        gstAmount,
        totalAmountUSD: subtotalUSD * (1 + GST_RATE),
        totalAmountINR: totalAmountINR,
        duration: duration,
        exchangeRate: {
          inrToUsd: inrToUsdRate,
          usdToInr: usdToInrRate,
        },
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/v1/payments/:id
 * Update payment
 */
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  // TODO: Implement payment update logic
  res.json({
    success: true,
    message: `Update payment ${id} - implement payment update logic`,
    data: { id, ...updateData },
    timestamp: new Date().toISOString()
  });
});

/**
 * DELETE /api/v1/payments/:id
 * Delete payment
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // TODO: Implement payment deletion logic
  res.json({
    success: true,
    message: `Delete payment ${id} - implement payment deletion logic`,
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/v1/payments/verify
 * Verify Razorpay payment
 */
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    console.log("Payment verification data:", {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature: razorpay_signature?.substring(0, 10) + "...",
    });

    // Verify Razorpay signature
    const body_string = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "0oZnTjgtBeJP9vbY9xMc0O8T")
      .update(body_string)
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (isSignatureValid) {
      console.log("Signature verification successful");

      // TODO: Replace with your database logic
      // For now, we'll simulate finding and updating a student record
      const mockStudent = {
        id: "student_123",
        email: "student@example.com",
        fullName: "John Doe",
        invoiceLink: "INV-2024-001",
        invoiceNumber: "INV-2024-001",
        programName: "Full Stack Development",
        programDuration: 6,
        addonName: "Advanced React",
        totalINR: 50000,
        paymentDate: new Date(),
        razorpayOrderId: razorpay_order_id,
        paymentStatus: "PROCESSING"
      };

      // Simulate database update
      const updatedStudent = {
        ...mockStudent,
        paymentId: razorpay_payment_id,
        paymentStatus: "COMPLETED",
        paymentMethod: "Razorpay",
        paymentDate: new Date(),
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      };

      console.log("Payment completed successfully");

      // Send invoice email
      try {
        const baseUrl = process.env.BASE_URL || "http://localhost:3000";
        
        const emailResponse = await fetch(`${baseUrl}/api/v1/invoices/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentEmail: updatedStudent.email,
            studentName: updatedStudent.fullName,
            invoiceLink: updatedStudent.invoiceLink,
            invoiceData: {
              invoiceNumber: updatedStudent.invoiceNumber,
              programName: updatedStudent.programName,
              duration: updatedStudent.programDuration,
              addonName: updatedStudent.addonName,
              total: updatedStudent.totalINR,
              paymentStatus: "Completed",
              paymentDate: updatedStudent.paymentDate,
            },
          }),
        });

        if (emailResponse.ok) {
          console.log("Invoice email sent successfully");
        } else {
          console.error("Failed to send invoice email:", await emailResponse.text());
        }
      } catch (emailError) {
        console.error("Error sending invoice email:", emailError);
      }

      res.json({
        success: true,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        invoiceId: updatedStudent.invoiceLink,
        studentId: updatedStudent.id,
        invoiceLink: updatedStudent.invoiceLink,
        timestamp: new Date().toISOString()
      });

    } else {
      console.log("Signature verification failed - payment remains PROCESSING");
      res.status(400).json({
        success: false,
        error: "Invalid signature",
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      error: "Payment verification failed",
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
