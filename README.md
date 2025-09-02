# SirtifAI Backend

A minimal Node.js + Express backend with MongoDB, file uploads, and invoice email functionality.

## 🚀 Features

- **Express Server**: Clean and minimal Express.js setup
- **MongoDB**: Database connection with Mongoose
- **File Upload**: Multer integration for single and multiple file uploads
- **Invoice Emails**: Professional email sending with Nodemailer
- **CORS**: Cross-origin resource sharing enabled
- **Environment Config**: Easy configuration with .env files

## 📁 Project Structure

```
src/
├── config/
│   └── db.js         # MongoDB connection
├── controllers/
│   ├── paymentController.js
│   └── invoiceController.js
├── middleware/
│   └── upload.js     # Multer configuration
├── app.js            # Express app setup
server.js             # Server entry point
package.json          # Dependencies
.env                  # Environment variables
```

## 🛠️ Installation

### Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- npm

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Xiorent-Technologies/sirtifai-backend.git
   cd sirtifai-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/sirtifai_db

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
BASE_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads/

# Razorpay Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

## 📚 API Endpoints

### Payment Management
- `GET /api/v1/payments` - Get all payments
- `GET /api/v1/payments/:id` - Get payment by ID
- `POST /api/v1/payments` - Create new payment
- `POST /api/v1/payments/create-order` - Create Razorpay order and student record
- `PUT /api/v1/payments/:id` - Update payment
- `DELETE /api/v1/payments/:id` - Delete payment
- `POST /api/v1/payments/verify` - Verify Razorpay payment

### Invoice Management
- `GET /api/v1/invoices` - Get all invoices
- `GET /api/v1/invoices/:id` - Get invoice by ID (with student details)
- `POST /api/v1/invoices` - Create new invoice
- `PUT /api/v1/invoices/:id` - Update invoice
- `DELETE /api/v1/invoices/:id` - Delete invoice
- `POST /api/v1/invoices/send` - Send invoice via email

### File Upload
- `POST /api/v1/upload/single` - Upload single file
- `POST /api/v1/upload/multiple` - Upload multiple files

### Health Check
- `GET /health` - Basic health check
- `GET /` - API information

## 📧 Invoice Email Service

### Send Invoice Email

**Endpoint:** `POST /api/v1/invoices/send`

**Description:** Sends a professional invoice email to students with payment confirmation and invoice details.

**Request Body:**
```json
{
  "studentEmail": "student@example.com",
  "studentName": "John Doe",
  "invoiceLink": "INV-2024-001",
  "invoiceData": {
    "invoiceNumber": "INV-2024-001",
    "programName": "Full Stack Development",
    "duration": 6,
    "addonName": "Advanced React",
    "total": 50000,
    "paymentStatus": "Paid",
    "paymentDate": "2024-01-15"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice email sent successfully",
  "data": {
    "studentEmail": "student@example.com",
    "invoiceNumber": "INV-2024-001",
    "invoiceUrl": "http://localhost:3000/invoice/INV-2024-001"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Email Configuration Requirements

To use the invoice email service, you need to configure Gmail SMTP:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Update Environment Variables:**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   BASE_URL=http://localhost:3000
   ```

### Email Template Features

- ✅ **Professional Design** - SIRTIFAI branded template
- ✅ **Payment Details** - Invoice number, program, amount, status
- ✅ **Responsive Layout** - Works on all devices
- ✅ **Call-to-Action** - Direct link to view invoice
- ✅ **Contact Information** - Support email and company details

## 💳 Razorpay Order Creation

### Create Order

**Endpoint:** `POST /api/v1/payments/create-order`

**Description:** Creates a Razorpay order and student record with complete pricing calculations, currency conversion, and invoice generation.

**Request Body:**
```json
{
  "packageData": {
    "selectedProduct": "fullstack",
    "selectedAddon": "react",
    "type": "program",
    "selectedMonths": 6
  },
  "studentData": {
    "fullName": "John Doe",
    "dateOfBirth": "1995-05-15",
    "countryOfCitizenship": "India",
    "primaryPhone": "+91-9876543210",
    "email": "john.doe@example.com",
    "residentialAddress": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "country": "India",
    "highestQualification": "Bachelor's Degree",
    "idType": "Aadhar",
    "idNumber": "123456789012",
    "agreedToTerms": true,
    "certifiedInformation": true
  },
  "receipt": "receipt_123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "id": "order_123456789",
  "amount": 7080000,
  "currency": "INR",
  "receipt": "receipt_123456",
  "status": "created",
  "studentId": "student_1704067200000",
  "invoiceLink": "uuid-generated-link",
  "pricing": {
    "programPriceUSD": 3000,
    "totalProgramPriceUSD": 3000,
    "addOnPriceUSD": 100,
    "subtotalUSD": 3100,
    "subtotalINR": 258333,
    "gstAmount": 46500,
    "totalAmountUSD": 3658,
    "totalAmountINR": 304833,
    "duration": 6,
    "exchangeRate": {
      "inrToUsd": 0.012,
      "usdToInr": 83.33
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Order Creation Features

- ✅ **Product Pricing** - Dynamic pricing based on program and addons
- ✅ **Currency Conversion** - Real-time USD to INR conversion
- ✅ **GST Calculation** - 18% GST on Indian transactions
- ✅ **Invoice Generation** - Unique invoice numbers and links
- ✅ **Student Registration** - Complete student data storage
- ✅ **Razorpay Integration** - Secure payment order creation
- ✅ **Data Validation** - Comprehensive input validation

## 💳 Razorpay Payment Verification

### Verify Payment

**Endpoint:** `POST /api/v1/payments/verify`

**Description:** Verifies Razorpay payment signature and updates payment status. Automatically sends invoice email upon successful verification.

**Request Body:**
```json
{
  "razorpay_order_id": "order_123456789",
  "razorpay_payment_id": "pay_123456789",
  "razorpay_signature": "signature_hash",
  "orderId": "order_123456789"
}
```

**Response (Success):**
```json
{
  "success": true,
  "paymentId": "pay_123456789",
  "orderId": "order_123456789",
  "invoiceId": "INV-2024-001",
  "studentId": "student_123",
  "invoiceLink": "INV-2024-001",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid signature",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Razorpay Configuration

To use Razorpay payment verification:

1. **Get Razorpay Credentials:**
   - Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Get your Key Secret from API Keys section

2. **Update Environment Variables:**
   ```env
   RAZORPAY_KEY_SECRET=your-razorpay-key-secret
   ```

### Payment Verification Features

- ✅ **Signature Verification** - Cryptographically secure signature validation
- ✅ **Payment Status Update** - Updates payment status to COMPLETED
- ✅ **Automatic Email** - Sends invoice email after successful payment
- ✅ **Error Handling** - Comprehensive error responses
- ✅ **Logging** - Detailed payment verification logs

## 📄 Invoice Retrieval

### Get Invoice Details

**Endpoint:** `GET /api/v1/invoices/:id`

**Description:** Retrieves detailed invoice information including student details. Only returns invoices for completed payments.

**Parameters:**
- `id` (string) - Invoice ID/link

**Response (Success):**
```json
{
  "success": true,
  "invoice": {
    "id": "student_123",
    "invoiceNumber": "INV-2024-001",
    "createdAt": "2024-01-15T00:00:00.000Z",
    "programName": "Full Stack Development",
    "programPrice": 500,
    "programPriceINR": 50000,
    "programDuration": 6,
    "addonName": "Advanced React",
    "addonPrice": 100,
    "addonPriceINR": 10000,
    "subtotal": 600,
    "subtotalINR": 60000,
    "gstRate": 18,
    "gstAmount": 108,
    "gstAmountINR": 10800,
    "total": 708,
    "totalINR": 70800,
    "exchangeRate": 100,
    "paymentStatus": "COMPLETED",
    "paymentMethod": "Razorpay",
    "paymentDate": "2024-01-15T00:00:00.000Z",
    "type": "program"
  },
  "student": {
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "primaryPhone": "+91-9876543210",
    "residentialAddress": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "country": "India"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invoice not found or payment not completed",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Invoice Retrieval Features

- ✅ **Payment Status Check** - Only returns invoices for completed payments
- ✅ **Complete Invoice Data** - Program details, pricing, GST calculations
- ✅ **Student Information** - Full student contact and address details
- ✅ **Error Handling** - Proper 404 responses for missing invoices
- ✅ **Security** - Prevents access to unpaid invoices

## 🧪 Testing

### Test Order Creation Endpoint

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/v1/payments/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "packageData": {
      "selectedProduct": "fullstack",
      "selectedAddon": "react",
      "type": "program",
      "selectedMonths": 6
    },
    "studentData": {
      "fullName": "John Doe",
      "dateOfBirth": "1995-05-15",
      "countryOfCitizenship": "India",
      "primaryPhone": "+91-9876543210",
      "email": "john.doe@example.com",
      "residentialAddress": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400001",
      "country": "India",
      "highestQualification": "Bachelor'\''s Degree",
      "idType": "Aadhar",
      "idNumber": "123456789012",
      "agreedToTerms": true,
      "certifiedInformation": true
    },
    "receipt": "receipt_123456"
  }'
```

### Test Invoice Retrieval Endpoint

**Example using curl:**
```bash
curl -X GET http://localhost:3000/api/v1/invoices/INV-2024-001
```

### Test Payment Verification Endpoint

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/v1/payments/verify \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_123456789",
    "razorpay_payment_id": "pay_123456789",
    "razorpay_signature": "signature_hash",
    "orderId": "order_123456789"
  }'
```

### Test Invoice Email Endpoint

**Example using curl:**
```bash
curl -X POST http://localhost:3000/api/v1/invoices/send \
  -H "Content-Type: application/json" \
  -d '{
    "studentEmail": "test@example.com",
    "studentName": "John Doe",
    "invoiceLink": "INV-2024-001",
    "invoiceData": {
      "invoiceNumber": "INV-2024-001",
      "programName": "Full Stack Development",
      "duration": 6,
      "addonName": "Advanced React",
      "total": 50000,
      "paymentStatus": "Paid",
      "paymentDate": "2024-01-15"
    }
  }'
```

## 📝 Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@sirtifai.com or create an issue in the repository.
