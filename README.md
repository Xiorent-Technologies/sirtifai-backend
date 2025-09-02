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
```

## 📚 API Endpoints

### Payment Management
- `GET /api/v1/payments` - Get all payments
- `GET /api/v1/payments/:id` - Get payment by ID
- `POST /api/v1/payments` - Create new payment
- `PUT /api/v1/payments/:id` - Update payment
- `DELETE /api/v1/payments/:id` - Delete payment

### Invoice Management
- `GET /api/v1/invoices` - Get all invoices
- `GET /api/v1/invoices/:id` - Get invoice by ID
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

## 🧪 Testing

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
