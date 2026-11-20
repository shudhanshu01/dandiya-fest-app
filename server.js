require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const cors = require('cors');
const path = require('path');
const Student = require('./models/student');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ROUTE 1: Student Login & Generate QR
app.post('/api/get-pass', async (req, res) => {
  const rollNumber = typeof req.body?.rollNumber === 'string' ? req.body.rollNumber.trim() : '';
  if (!rollNumber) return res.status(400).json({ success: false, error: 'Roll number is required.' });

  try {
    const student = await Student.findOne({ rollNumber });

    if (!student) {
      return res.status(403).json({ success: false, error: 'Access Denied: Roll number not found in college records!' });
    }

    const qrImage = await QRCode.toDataURL(student.rollNumber, { width: 300, margin: 2 });
    res.json({
      success: true,
      name: student.name,
      branch: student.branch,
      rollNumber: student.rollNumber,
      qrImage
    });
  } catch (err) {
    console.error('Pass generation failed:', err);
    res.status(500).json({ success: false, error: 'Server error during pass generation.' });
  }
});

// ROUTE 2: Gate Scanner Verification (One-Time Use Enforcement)
app.post('/api/verify-pass', async (req, res) => {
  const rollNumber = typeof req.body?.rollNumber === 'string' ? req.body.rollNumber.trim() : '';
  if (!rollNumber) return res.status(400).json({ success: false, message: 'Invalid scan data.' });

  try {
    const student = await Student.findOneAndUpdate(
      { rollNumber, isUsed: { $ne: true } },
      { $set: { isUsed: true, usedAt: new Date() } },
      { new: true, runValidators: true }
    );

    if (!student) {
      const existingStudent = await Student.findOne({ rollNumber });
      if (!existingStudent) {
        return res.status(400).json({ success: false, message: '❌ INVALID PASS: Roll number does not exist!' });
      }

      const usedAt = existingStudent.usedAt
        ? new Date(existingStudent.usedAt).toLocaleTimeString()
        : 'an earlier time';
      return res.status(400).json({
        success: false,
        message: `🚨 ALREADY USED! ${existingStudent.name} (${existingStudent.rollNumber}) entered at ${usedAt}`
      });
    }

    res.json({
      success: true,
      message: `✅ ACCESS GRANTED: Welcome, ${student.name} (${student.branch})!`
    });

  } catch (err) {
    console.error('Pass verification failed:', err);
    res.status(500).json({ success: false, message: 'Server verification error.' });
  }
});

app.use((err, req, res, next) => {
  console.error('Request failed:', err);
  if (res.headersSent) return next(err);

  const status = err.status === 400 ? 400 : 500;
  res.status(status).json({
    success: false,
    error: status === 400 ? 'Invalid JSON request body.' : 'Request failed.'
  });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas/Local');

  const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  server.on('error', err => {
    console.error('❌ Server failed to start:', err);
    process.exitCode = 1;
  });
}

startServer().catch(err => {
  console.error('❌ Application startup failed:', err);
  process.exitCode = 1;
});