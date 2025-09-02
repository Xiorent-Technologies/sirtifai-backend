import express from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import { v4 as uuidv4 } from 'uuid';
import {getProductById} from "../utils/products.js"
import Student from '../models/Student.js';
import { STUDENT_STATUS, PAYMENT_STATUS } from '../config/constants.js';

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

// Mock currency conversion (replace with your actual currency service)
async function getINRToUSDRate() {
  // Mock rate - replace with actual API call
  return 0.012; // 1 INR = 0.012 USD
}

function convertUSDToINR(usdAmount, inrToUsdRate) {
  return usdAmount / inrToUsdRate;
}

// Updated function to handle multiple addons
async function createStandardizedPackageData(selectedProductType, selectedProduct, selectedAddons, duration) {
  console.log("Creating standardized package data...", { selectedProductType, selectedProduct, selectedAddons, duration });

  // Get the main product
  const product = await getProductById(selectedProductType, selectedProduct);
  if (!product) {
    throw new Error(`Product not found: ${selectedProductType} / ${selectedProduct}`);
  }

  // Determine corresponding addon type based on selectedProductType
  const addonTypeMap = {
    programs: 'programAddons',
    freelancer: 'freelancerAddons',
    international: 'internationalAddons'
  };

  const selectedAddonType = addonTypeMap[selectedProductType];
  if (!selectedAddonType) {
    throw new Error(`Unknown addon type for: ${selectedProductType}`);
  }

  // Handle multiple addons
  let addonsData = [];
  let totalAddonPrice = 0;

  if (Array.isArray(selectedAddons) && selectedAddons.length > 0) {
    for (const addonId of selectedAddons) {
      const addon = await getProductById(selectedAddonType, addonId);
      if (addon) {
        addonsData.push(addon);
        totalAddonPrice += addon.price || 0; // Use `price` not `basePrice`
      }
    }
  }

  // Calculate pricing
  const programPrice = product.type === 'monthly' ? product.price * duration : product.price;
  const subtotal = programPrice + totalAddonPrice;

  return {
    type: selectedProductType,
    selectedProduct,
    selectedAddons,
    productData: product,
    addonsData,
    pricing: {
      programUnitPrice: product.price,
      programPrice,
      addonPrice: totalAddonPrice,
      subtotal,
      total: subtotal // GST is already included, based on your earlier note
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
    const selectedProductType = packageData?.type;
    const selectedAddons = packageData?.selectedAddon || []; 
    const duration = packageData?.productData?.duration || packageData?.selectedMonths || 1;

    // Get product details
    const product = await getProductById(selectedProductType, selectedProduct);

    if (!product) {
      console.error('Product not found for ID:', selectedProduct);
      return res.status(400).json({
        success: false,
        error: 'Product not found',
        timestamp: new Date().toISOString()
      });
    }

    // Calculate pricing (all in INR now)
    const standardizedData = await createStandardizedPackageData(
      selectedProductType,
      selectedProduct,
      selectedAddons,
      duration
    );
    const programUnitPrice = standardizedData.pricing.programUnitPrice;
    const programPriceINR = standardizedData.pricing.programPrice;
    const addonPriceINR = standardizedData.pricing.addonPrice;
    const subtotalINR = standardizedData.pricing.subtotal;
    const addonsData = standardizedData.addonsData;

    console.log('Calculated pricing (INR):', {
      programUnitPrice,
      programPriceINR,
      addonPriceINR,
      subtotalINR,
      duration,
      addonsData
    });

    if (isNaN(programPriceINR) || isNaN(subtotalINR)) {
      console.error('Invalid pricing calculation:', {
        programPriceINR,
        duration,
        addonPriceINR,
        subtotalINR,
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid pricing calculation',
        timestamp: new Date().toISOString()
      });
    }

    // Final INR amount (GST can be added if needed)
    const totalAmountINR = subtotalINR;

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

    // Prepare addon names for storage
    const addonNames = addonsData.map(addon => addon.name).join(', ');
    const selectedAddonIds = Array.isArray(selectedAddons) ? selectedAddons : (selectedAddons ? [selectedAddons] : []);

    // Mock Student Record (replace with DB save)
    const newStudent = new Student({
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
      idDocumentBase64: studentData.idDocumentBase64 || null,
      idDocumentName: studentData.idDocumentName || null,
      idDocumentType: studentData.idDocumentType || null,
      
      // Student Photo
      studentPhotoBase64: studentData.studentPhotoBase64 || null,
      studentPhotoName: studentData.studentPhotoName || null,
      studentPhotoType: studentData.studentPhotoType || null,

      // Program Selection & Pricing
      programType: selectedProductType,
      selectedProgram: selectedProduct, // This should be ObjectId
      programName: product.name,
      programDuration: duration,
      programUnitPrice,
      programPriceINR,
      selectedAddons: selectedAddonIds, // Array of ObjectIds
      selectedAddonNames: addonNames,
      addonPriceINR,
      addonsData, // Full addon data with prices

      // Invoice Details
      invoiceNumber,
      subtotalINR,
      gstRate: GST_RATE * 100, 
      // gstAmountINR: 0,
      totalINR: subtotalINR,
      gstRate: GST_RATE * 100, 
      // gstAmountINR: subtotalINR * GST_RATE,
      // totalINR: subtotalINR * (1 + GST_RATE),

      // Payment Details
      paymentStatus: PAYMENT_STATUS.PROCESSING, // Use constant instead of string
      razorpayOrderId: order.id,
      invoiceLink,

      // Confirmation
      agreedToTerms: studentData.agreedToTerms || false,
      certifiedInformation: studentData.certifiedInformation || false,

      // Additional fields (optional)
      status: STUDENT_STATUS.PENDING,
      registrationSource: 'WEBSITE', // or whatever source
    });


    const savedStudent = await newStudent.save();
    
    console.log('Student created successfully:', savedStudent.studentId);
    // return savedStudent;


    console.log('Student record created successfully:', {
      studentId: savedStudent.studentId,
      orderId: order.id,
      invoiceNumber,
      programName: product.name,
      addonNames: addonNames,
      selectedAddons: selectedAddonIds,
      totalAmountINR,
    });

    res.json({
      success: true,
      ...order,
      studentId: savedStudent.studentId,
      invoiceLink,
      pricing: {
        programPriceINR,
        addonPriceINR,
        subtotalINR,
        // gstAmountINR: subtotalINR * GST_RATE,
        totalAmountINR: subtotalINR * (1 + GST_RATE),
        duration,
        addonsData,
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

    if (!isSignatureValid) {
      console.log("Signature verification failed - payment remains PROCESSING");
      return res.status(400).json({
        success: false,
        error: "Invalid signature",
        timestamp: new Date().toISOString()
      });
    }

    console.log("Signature verification successful");

    // Find student by Razorpay order ID
    const student = await Student.findByRazorpayOrderId(razorpay_order_id);
    
    if (!student) {
      console.error("Student not found for order ID:", razorpay_order_id);
      return res.status(404).json({
        success: false,
        error: "Student record not found for this order",
        timestamp: new Date().toISOString()
      });
    }

    console.log("Found student:", student.studentId, student.email);

    // Check if payment is already processed
    if (student.paymentStatus === PAYMENT_STATUS.SUCCESS) {
      console.log("Payment already processed for student:", student.studentId);
      return res.json({
        success: true,
        message: "Payment already processed",
        paymentId: student.razorpayPaymentId,
        orderId: razorpay_order_id,
        invoiceId: student.invoiceLink,
        studentId: student.studentId,
        invoiceLink: student.invoiceLink,
        timestamp: new Date().toISOString()
      });
    }

    // Start database transaction (if using MongoDB with transactions)
    const session = await Student.startSession();
    session.startTransaction();

    try {
      // Update payment status using the model's instance method
      await student.updatePaymentStatus(PAYMENT_STATUS.SUCCESS, razorpay_payment_id);
      
      console.log("Payment completed successfully for student:", student.studentId);

      // Prepare invoice data for email
      const invoiceData = {
        studentId: student.studentId,
        studentEmail: student.email,
        studentName: student.fullName,
        invoiceLink: student.invoiceLink,
        invoiceNumber: student.invoiceNumber,
        programName: student.programName,
        programDuration: student.programDuration,
        addonNames: student.selectedAddonNames,
        subtotal: student.subtotalINR,
        gstRate: student.gstRate,
        // gstAmount: student.gstAmountINR,
        total: student.totalINR,
        paymentStatus: "Completed",
        paymentDate: student.paymentDate,
        paymentMethod: "Razorpay",
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
      };

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      // Send invoice email (after successful database update)
      try {
        const baseUrl = process.env.BASE_URL || "http://localhost:8000";
        
        const emailResponse = await fetch(`${baseUrl}/api/v1/invoices/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(invoiceData),
        });

        if (emailResponse.ok) {
          console.log("Invoice email sent successfully to:", student.email);
        } else {
          const errorText = await emailResponse.text();
          console.error("Failed to send invoice email:", errorText);
          // Note: We don't fail the payment verification if email fails
        }
      } catch (emailError) {
        console.error("Error sending invoice email:", emailError);
        // Note: We don't fail the payment verification if email fails
      }

      // Return success response
      res.json({
        success: true,
        message: "Payment verified and student enrolled successfully",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        invoiceId: student.invoiceLink,
        studentId: student.studentId,
        invoiceLink: student.invoiceLink,
        enrollmentStatus: student.status,
        timestamp: new Date().toISOString(),
        studentDetails: {
          name: student.fullName,
          email: student.email,
          program: student.programName,
          totalAmount: student.totalINR,
          enrollmentDate: student.enrollmentDate
        }
      });

    } catch (transactionError) {
      // Rollback transaction on error
      await session.abortTransaction();
      session.endSession();
      throw transactionError;
    }

  } catch (error) {
    console.error("Error verifying payment:", error);
    
    // Handle specific database errors
    let errorMessage = "Payment verification failed";
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = "Invalid student data";
      statusCode = 400;
    } else if (error.name === 'CastError') {
      errorMessage = "Invalid student ID format";
      statusCode = 400;
    } else if (error.code === 11000) {
      errorMessage = "Duplicate payment record";
      statusCode = 409;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});


export default router;
