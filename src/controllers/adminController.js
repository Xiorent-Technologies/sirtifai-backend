import express from 'express';
import dotenv from 'dotenv';
import Student from '../models/Student.js';
import { PAGINATION } from '../config/constants.js';

// Load environment variables
dotenv.config();

const router = express.Router();

// GET all students with pagination
router.get('/', async (req, res) => {
  try {
    // Parse query params with defaults
    const page = Math.max(parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE, 1);
    let limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    limit = Math.min(limit, PAGINATION.MAX_LIMIT);

    const skip = (page - 1) * limit;

    // Count total students
    const totalStudents = await Student.countDocuments();

    // Fetch students with pagination
    const students = await Student.find()
      .select('+idDocumentBase64 +studentPhotoBase64')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // newest first

    // Format response data
    const formattedStudents = students.map(student => ({
      id: student._id,
      fullName: student.fullName,
      dateOfBirth: student.dateOfBirth,
      countryOfCitizenship: student.countryOfCitizenship,
      referralCode: student.referralCode,

      primaryPhone: student.primaryPhone,
      secondaryPhone: student.secondaryPhone,
      whatsappNotifications: student.whatsappNotifications,
      email: student.email,
      residentialAddress: student.residentialAddress,
      city: student.city,
      state: student.state,
      zipCode: student.zipCode,
      country: student.country,

      highestQualification: student.highestQualification,
      specialization: student.specialization,

      currentProfession: student.currentProfession,
      currentOrganization: student.currentOrganization,
      linkedinProfile: student.linkedinProfile,

      idType: student.idType,
      idNumber: student.idNumber,
      idDocument: student.idDocumentBase64
        ? {
            name: student.idDocumentName,
            type: student.idDocumentType,
            base64: student.idDocumentBase64,
          }
        : null,

      studentPhoto: student.studentPhotoBase64
        ? {
            name: student.studentPhotoName,
            type: student.studentPhotoType,
            base64: student.studentPhotoBase64,
          }
        : null,

      programType: student.programType,
      programName: student.programName,
      programDuration: student.programDuration,
      programPriceINR: student.programPriceINR,
      selectedAddons: student.selectedAddons,
      addonPriceINR: student.addonPriceINR,

      invoiceNumber: student.invoiceNumber,
      subtotalINR: student.subtotalINR,
      gstRate: student.gstRate,
      totalINR: student.totalINR,

      paymentStatus: student.paymentStatus,
      razorpayOrderId: student.razorpayOrderId,
      invoiceLink: student.invoiceLink,

      agreedToTerms: student.agreedToTerms,
      certifiedInformation: student.certifiedInformation,

      status: student.status,
      registrationSource: student.registrationSource,
      createdAt: student.createdAt,
    }));

    res.json({
      success: true,
      message: 'Students retrieved successfully',
      data: formattedStudents,
      pagination: {
        total: totalStudents,
        totalPages: Math.ceil(totalStudents / limit),
        page,
        limit,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message,
    });
  }
});

export default router;
