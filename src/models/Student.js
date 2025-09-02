import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { STUDENT_STATUS, PAYMENT_STATUS, ID_TYPES, QUALIFICATION_LEVELS } from '../config/constants.js';

/**
 * Student model for MongoDB using Mongoose
 * Comprehensive schema for student registration and program enrollment
 */

const studentSchema = new mongoose.Schema({
  // 1. Identification
  studentId: {
    type: String,
    unique: true,
    required: [true, 'Student ID is required'],
    default: () => `STU_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  },

  // 2. Personal Details
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters'],
    maxlength: [100, 'Full name cannot exceed 100 characters'],
    match: [/^[a-zA-Z\s.'-]+$/, 'Full name can only contain letters, spaces, dots, apostrophes, and hyphens'],
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(date) {
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
          age--;
        }
        
        return date < today && age >= 16 && age <= 100;
      },
      message: 'Student must be between 16 and 100 years old',
    },
  },
  countryOfCitizenship: {
    type: String,
    required: [true, 'Country of citizenship is required'],
    trim: true,
    minlength: [2, 'Country name must be at least 2 characters'],
    maxlength: [50, 'Country name cannot exceed 50 characters'],
  },
  referralCode: {
    type: String,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9]{6,20}$/, 'Referral code must be 6-20 characters long and contain only letters and numbers'],
    sparse: true, // Allows multiple null values while maintaining uniqueness for non-null values
  },

  // 3. Contact Information
  primaryPhone: {
    type: String,
    required: [true, 'Primary phone number is required'],
    trim: true,
    match: [/^\+?[\d\s\-\(\)]{10,15}$/, 'Please enter a valid primary phone number'],
  },
  secondaryPhone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]{10,15}$/, 'Please enter a valid secondary phone number'],
    validate: {
      validator: function(phone) {
        return !phone || phone !== this.primaryPhone;
      },
      message: 'Secondary phone must be different from primary phone',
    },
  },
  whatsappNotifications: {
    type: Boolean,
    default: false,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    // unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  residentialAddress: {
    type: String,
    required: [true, 'Residential address is required'],
    trim: true,
    minlength: [10, 'Address must be at least 10 characters'],
    maxlength: [200, 'Address cannot exceed 200 characters'],
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    minlength: [2, 'City name must be at least 2 characters'],
    maxlength: [50, 'City name cannot exceed 50 characters'],
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    minlength: [2, 'State name must be at least 2 characters'],
    maxlength: [50, 'State name cannot exceed 50 characters'],
  },
  zipCode: {
    type: String,
    required: [true, 'ZIP code is required'],
    trim: true,
    match: [/^\d{5,10}$/, 'ZIP code must be 5-10 digits'],
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    minlength: [2, 'Country name must be at least 2 characters'],
    maxlength: [50, 'Country name cannot exceed 50 characters'],
  },

  // 4. Education
  highestQualification: {
    type: String,
    required: [true, 'Highest qualification is required'],
    // enum: {
    //   values: Object.values(QUALIFICATION_LEVELS),
    //   message: 'Please select a valid qualification level',
    // },
  },
  specialization: {
    type: String,
    trim: true,
    maxlength: [100, 'Specialization cannot exceed 100 characters'],
  },

  // 5. Professional
  currentProfession: {
    type: String,
    trim: true,
    maxlength: [100, 'Current profession cannot exceed 100 characters'],
  },
  currentOrganization: {
    type: String,
    trim: true,
    maxlength: [100, 'Current organization cannot exceed 100 characters'],
  },
  linkedinProfile: {
    type: String,
    trim: true,
    match: [/^https?:\/\/(www\.)?linkedin\.com\/.*$/, 'Please enter a valid LinkedIn profile URL'],
  },

  // 6. Identity Document
  idType: {
    type: String,
    required: [true, 'ID type is required'],
    // enum: {
    //   values: Object.values(ID_TYPES),
    //   message: 'Please select a valid ID type',
    // },
  },
  idNumber: {
    type: String,
    required: [true, 'ID number is required'],
    trim: true,
    uppercase: true,
    minlength: [5, 'ID number must be at least 5 characters'],
    maxlength: [20, 'ID number cannot exceed 20 characters'],
    validate: {
      validator: function(idNumber) {
        // Basic validation based on ID type
        switch (this.idType) {
          case 'AADHAAR':
            return /^\d{12}$/.test(idNumber);
          case 'PASSPORT':
            return /^[A-Z]\d{7}$/.test(idNumber);
          case 'DRIVING_LICENSE':
            return /^[A-Z]{2}\d{13}$/.test(idNumber);
          case 'PAN':
            return /^[A-Z]{5}\d{4}[A-Z]$/.test(idNumber);
          default:
            return idNumber.length >= 5;
        }
      },
      message: 'Please enter a valid ID number for the selected ID type',
    },
  },
  idDocumentBase64: {
    type: String,
    select: false, // Don't include in regular queries for performance
    validate: {
      validator: function(base64) {
        return !base64 || /^data:/.test(base64);
      },
      message: 'ID document must be in valid base64 format',
    },
  },
  idDocumentName: {
    type: String,
    trim: true,
    maxlength: [100, 'Document name cannot exceed 100 characters'],
  },
  idDocumentType: {
    type: String,
    enum: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    message: 'Document must be JPEG, PNG, or PDF format',
  },

  // 7. Student Photo
  studentPhotoBase64: {
    type: String,
    select: false, // Don't include in regular queries for performance
    validate: {
      validator: function(base64) {
        return !base64 || /^data:image\//.test(base64);
      },
      message: 'Student photo must be in valid image base64 format',
    },
  },
  studentPhotoName: {
    type: String,
    trim: true,
    maxlength: [100, 'Photo name cannot exceed 100 characters'],
  },
  studentPhotoType: {
    type: String,
    enum: ['image/jpeg', 'image/png', 'image/jpg'],
    message: 'Photo must be JPEG or PNG format',
  },

  // 8. Program Selection & Pricing
  programType: {
    type: String,
    required: [true, 'Program type is required'],
    trim: true,
    maxlength: [50, 'Program type cannot exceed 50 characters'],
  },
  selectedProgram: {
  type: String,
  required: true,
},
  programName: {
    type: String,
    required: [true, 'Program name is required'],
    trim: true,
    maxlength: [200, 'Program name cannot exceed 200 characters'],
  },
  programDuration: {
    type: Number,
    required: [true, 'Program duration is required'],
    min: [1, 'Program duration must be at least 1 month'],
    max: [60, 'Program duration cannot exceed 60 months'],
  },
  programPriceINR: {
    type: Number,
    required: [true, 'Program price is required'],
    min: [0, 'Program price cannot be negative'],
    validate: {
      validator: function(price) {
        return price >= 0 && price <= 10000000; // Max 1 crore
      },
      message: 'Program price must be between 0 and 10,000,000 INR',
    },
  },

  // 9. Addons
  selectedAddons: [{ type: String }],
  selectedAddonNames: {
    type: String,
    trim: true,
    maxlength: [500, 'Addon names cannot exceed 500 characters'],
  },
  addonPriceINR: {
    type: Number,
    default: 0,
    min: [0, 'Addon price cannot be negative'],
    validate: {
      validator: function(price) {
        return price >= 0 && price <= 5000000; // Max 50 lakhs for addons
      },
      message: 'Addon price must be between 0 and 5,000,000 INR',
    },
  },
  addonsData: [{
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  }],

  // 10. Invoice Details
  invoiceNumber: {
    type: String,
    unique: true,
    required: [true, 'Invoice number is required'],
    default: () => `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    // match: [/^INV-\d+-[A-Z0-9]{5}$/, 'Invalid invoice number format'],
  },
  subtotalINR: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative'],
    validate: {
      validator: function(subtotal) {
        const expectedSubtotal = this.programPriceINR + this.addonPriceINR;
        return Math.abs(subtotal - expectedSubtotal) < 1; // Allow for rounding differences
      },
      message: 'Subtotal must equal program price plus addon price',
    },
  },
  gstRate: {
    type: Number,
    required: [true, 'GST rate is required'],
    min: [0, 'GST rate cannot be negative'],
    max: [50, 'GST rate cannot exceed 50%'],
    default: 18, // Default GST rate in India
  },
  gstAmountINR: {
    type: Number,
    required: [true, 'GST amount is required'],
    min: [0, 'GST amount cannot be negative'],
    validate: {
      validator: function(gstAmount) {
        const expectedGST = this.subtotalINR * (this.gstRate / 100);
        return Math.abs(gstAmount - expectedGST) < 1; // Allow for rounding differences
      },
      message: 'GST amount must be calculated correctly from subtotal and GST rate',
    },
  },
  totalINR: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative'],
    validate: {
      validator: function(total) {
        const expectedTotal = this.subtotalINR + this.gstAmountINR;
        return Math.abs(total - expectedTotal) < 1; // Allow for rounding differences
      },
      message: 'Total must equal subtotal plus GST amount',
    },
  },

  // 11. Payment Details
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING,
    required: [true, 'Payment status is required'],
  },
  razorpayOrderId: {
    type: String,
    required: [true, 'Razorpay order ID is required'],
    trim: true,
    match: [/^order_[A-Za-z0-9]+$/, 'Invalid Razorpay order ID format'],
  },
  razorpayPaymentId: {
    type: String,
    trim: true,
    match: [/^pay_[A-Za-z0-9]+$/, 'Invalid Razorpay payment ID format'],
  },
  paymentDate: {
    type: Date,
  },
  invoiceLink: {
    type: String,
    unique: true,
    default: () => require('crypto').randomUUID(),
    match: [/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, 'Invalid UUID format for invoice link'],
  },

  // 12. Confirmation & Agreements
  agreedToTerms: {
    type: Boolean,
    required: [true, 'Agreement to terms is required'],
    validate: {
      validator: function(agreed) {
        return agreed === true;
      },
      message: 'Student must agree to terms and conditions',
    },
  },
  certifiedInformation: {
    type: Boolean,
    required: [true, 'Information certification is required'],
    validate: {
      validator: function(certified) {
        return certified === true;
      },
      message: 'Student must certify that provided information is correct',
    },
  },
  termsAgreedAt: {
    type: Date,
    default: Date.now,
  },

  // 13. Status & Tracking
  status: {
    type: String,
    enum: Object.values(STUDENT_STATUS),
    default: STUDENT_STATUS.PENDING,
  },
  enrollmentDate: {
    type: Date,
  },
  completionDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || !this.enrollmentDate || date >= this.enrollmentDate;
      },
      message: 'Completion date must be after enrollment date',
    },
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    select: false,
  },
  emailVerificationExpires: {
    type: Date,
    select: false,
  },

  // 14. Additional Metadata
  registrationSource: {
    type: String,
    enum: ['WEBSITE', 'MOBILE_APP', 'ADMIN_PANEL', 'BULK_IMPORT'],
    default: 'WEBSITE',
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    trim: true,
  },
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive data from JSON output
      delete ret.idDocumentBase64;
      delete ret.studentPhotoBase64;
      delete ret.emailVerificationToken;
      delete ret.emailVerificationExpires;
      return ret;
    }
  },
  toObject: { virtuals: true },
});

// Indexes for better performance
// studentSchema.index({ email: 1 }, { unique: true });
studentSchema.index({ studentId: 1 }, { unique: true });
studentSchema.index({ invoiceNumber: 1 }, { unique: true });
studentSchema.index({ invoiceLink: 1 }, { unique: true });
studentSchema.index({ razorpayOrderId: 1 });
studentSchema.index({ paymentStatus: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ enrollmentDate: -1 });
studentSchema.index({ createdAt: -1 });
studentSchema.index({ primaryPhone: 1 });
studentSchema.index({ idType: 1, idNumber: 1 }, { unique: true }); // Prevent duplicate IDs
studentSchema.index({ selectedProgram: 1 });
studentSchema.index({ referralCode: 1 }, { sparse: true });

// Compound indexes
studentSchema.index({ status: 1, paymentStatus: 1 });
studentSchema.index({ countryOfCitizenship: 1, status: 1 });

// Virtual for age calculation
studentSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual for full address
studentSchema.virtual('fullAddress').get(function() {
  return `${this.residentialAddress}, ${this.city}, ${this.state}, ${this.zipCode}, ${this.country}`;
});

// Virtual for program completion status
studentSchema.virtual('isCompleted').get(function() {
  return this.status === STUDENT_STATUS.COMPLETED;
});

// Virtual for payment completion status
studentSchema.virtual('isPaymentComplete').get(function() {
  return this.paymentStatus === PAYMENT_STATUS.SUCCESS;
});

// Pre-save middleware for data validation and cleanup
studentSchema.pre('save', function(next) {
  // Auto-set enrollment date when status changes to ENROLLED
  if (this.isModified('status') && this.status === STUDENT_STATUS.ENROLLED && !this.enrollmentDate) {
    this.enrollmentDate = new Date();
  }
  
  // Auto-set completion date when status changes to COMPLETED
  if (this.isModified('status') && this.status === STUDENT_STATUS.COMPLETED && !this.completionDate) {
    this.completionDate = new Date();
  }
  
  // Set payment date when payment status changes to SUCCESS
  if (this.isModified('paymentStatus') && this.paymentStatus === PAYMENT_STATUS.SUCCESS && !this.paymentDate) {
    this.paymentDate = new Date();
  }
  
  // Update last activity
  this.lastActivity = new Date();
  
  next();
});

// Instance method to generate email verification token
studentSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return token;
};

// Instance method to verify email
studentSchema.methods.verifyEmail = function() {
  this.isEmailVerified = true;
  this.emailVerificationToken = undefined;
  this.emailVerificationExpires = undefined;
  return this.save();
};

// Instance method to update payment status
studentSchema.methods.updatePaymentStatus = function(status, paymentId = null) {
  this.paymentStatus = status;
  if (paymentId) {
    this.razorpayPaymentId = paymentId;
  }
  if (status === PAYMENT_STATUS.SUCCESS) {
    this.paymentDate = new Date();
    this.status = STUDENT_STATUS.ENROLLED;
  }
  return this.save();
};

// Instance method to enroll student
studentSchema.methods.enroll = function() {
  this.status = STUDENT_STATUS.ENROLLED;
  this.enrollmentDate = new Date();
  return this.save();
};

// Instance method to complete program
studentSchema.methods.completeProgram = function() {
  this.status = STUDENT_STATUS.COMPLETED;
  this.completionDate = new Date();
  return this.save();
};

// Static method to find by email
studentSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by student ID
studentSchema.statics.findByStudentId = function(studentId) {
  return this.findOne({ studentId });
};

// Static method to find by invoice number
studentSchema.statics.findByInvoiceNumber = function(invoiceNumber) {
  return this.findOne({ invoiceNumber });
};

// Static method to find by Razorpay order ID
studentSchema.statics.findByRazorpayOrderId = function(razorpayOrderId) {
  return this.findOne({ razorpayOrderId });
};

// Static method to get student statistics
studentSchema.statics.getStudentStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        enrolledStudents: {
          $sum: { $cond: [{ $eq: ['$status', STUDENT_STATUS.ENROLLED] }, 1, 0] }
        },
        completedStudents: {
          $sum: { $cond: [{ $eq: ['$status', STUDENT_STATUS.COMPLETED] }, 1, 0] }
        },
        verifiedStudents: {
          $sum: { $cond: ['$isEmailVerified', 1, 0] }
        },
        successfulPayments: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', PAYMENT_STATUS.SUCCESS] }, 1, 0] }
        },
        totalRevenue: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', PAYMENT_STATUS.SUCCESS] }, '$totalINR', 0] }
        },
      }
    }
  ]);
};

// Static method to find students by program
studentSchema.statics.findByProgram = function(programId) {
  return this.find({ selectedProgram: programId });
};

// Static method to find students by payment status
studentSchema.statics.findByPaymentStatus = function(status) {
  return this.find({ paymentStatus: status });
};

// Static method to find students by status
studentSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

// Static method for revenue analytics
studentSchema.statics.getRevenueAnalytics = function(startDate, endDate) {
  const pipeline = [
    {
      $match: {
        paymentStatus: PAYMENT_STATUS.SUCCESS,
        paymentDate: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalINR' },
        programRevenue: { $sum: '$programPriceINR' },
        addonRevenue: { $sum: '$addonPriceINR' },
        gstCollected: { $sum: '$gstAmountINR' },
        studentCount: { $sum: 1 },
        averageOrderValue: { $avg: '$totalINR' }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

// Create and export the model
const Student = mongoose.model('Student', studentSchema);

export default Student;