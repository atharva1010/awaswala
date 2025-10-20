const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const twilio = require('twilio');
require('dotenv').config();
const jwt = require("jsonwebtoken");
const app = express();

// ---------------- MIDDLEWARE ---------------- //
app.use(cors({ origin: ['http://localhost:5173'], credentials: true }));
app.use(helmet());
app.use(express.json());

// Rate limiter
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// ---------------- MONGODB ---------------- //
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// ---------------- CLOUDINARY ---------------- //
cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ---------------- MULTER ---------------- //
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ---------------- USER SCHEMA ---------------- //
const userSchema = new mongoose.Schema({
  name: String,
  mobile: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  profilePic: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// ---------------- AGENT SCHEMA ---------------- //
const agentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true
  },
  aadharNumber: {
    type: String,
    required: true,
    unique: true
  },
  profilePic: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false  // Admin approve karne ke baad true hoga
  },
  isActive: {
    type: Boolean,
    default: true   // Admin block kar sake
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  zone: {
    type: String,
    required: true
  },
  commissionRate: {
    type: Number,
    default: 5
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  pendingPayout: {
    type: Number,
    default: 0
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String
}, {
  timestamps: true
});

// Hash password before saving
agentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
agentSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const Agent = mongoose.model('Agent', agentSchema);

// ---------------- ROOM SCHEMA ---------------- //
const RoomSchema = new mongoose.Schema({
  roomId: String,
  title: String,
  rent: Number,
  address: String,
  city: String,
  state: String,
  pin: String,
  description: String,
  images: [String],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },
  verificationDate: Date,
  status: {
    type: String,
    enum: ["Pending", "Processed", "Verified", "Booked", "Rejected", "Suspended", "Available", "Under Review", "Cancelled"], // "Cancelled" add karo
    default: "Pending"
  },
  cancelledAt: { type: Date }, // Optional: Cancellation timestamp add karo
  createdAt: { type: Date, default: Date.now }
});

const Room = mongoose.model("Room", RoomSchema);

// ---------------- VERIFICATION SCHEMA ---------------- //
const verificationSchema = new mongoose.Schema({
  roomId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Room", 
    required: true 
  },
  agentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Agent", 
    required: true 
  },
  // Agent details for quick reference
  agentName: {
    type: String,
    required: true
  },
  agentEmail: {
    type: String,
    required: true
  },
  agentPhone: {
    type: String,
    required: true
  },
  agentZone: {
    type: String,
    required: true
  },
  // Room details for quick reference
  roomNumber: {
    type: String,
    required: true
  },
  roomTitle: {
    type: String,
    required: true
  },
  roomRent: {
    type: Number,
    required: true
  },
  roomLocation: {
    type: String,
    required: true
  },
  // Verification documents
  aadharDoc: String,
  electricityBillDoc: String,
  ownerPhoto: String,
  roomPhotos: [String],
  status: {
    type: String,
    enum: ["Submitted", "Under Review", "Approved", "Rejected"],
    default: "Submitted"
  },
  submittedAt: { 
    type: Date, 
    default: Date.now 
  },
  reviewedAt: Date,
  reviewNotes: String
});

const Verification = mongoose.model("Verification", verificationSchema);

// ---------------- CLOUDINARY UPLOAD ---------------- //
async function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

// ---------------- TWILIO SETUP ---------------- //
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const otpStorage = new Map(); // temporary OTP storage

function sendOTP(mobile, otp) {
  return twilioClient.messages.create({
    body: `Your AwasWala OTP is ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: mobile.startsWith('+') ? mobile : `+91${mobile}`
  });
}

// ---------------- AUTH MIDDLEWARE ---------------- //
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ success: false, message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// ---------------- AGENT AUTH MIDDLEWARE ---------------- //
const authenticateAgent = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is an agent
    if (decoded.role !== 'agent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Agent role required.'
      });
    }

    // Find agent
    const agent = await Agent.findById(decoded.id).select('-password');
    if (!agent) {
      return res.status(401).json({
        success: false,
        message: 'Agent not found. Token invalid.'
      });
    }

    // Check if agent is verified
    if (!agent.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Agent account not verified. Please contact admin.'
      });
    }

    req.agent = agent;
    next();
  } catch (error) {
    console.error('Agent authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// ---------------- AUTH ROUTES (Updated) ---------------- //

// SIGNUP - Multiple endpoints for compatibility
app.post('/api/signup', upload.single('profilePic'), async (req, res) => {
  await handleSignup(req, res);
});

app.post('/api/auth/register', upload.single('profilePic'), async (req, res) => {
  await handleSignup(req, res);
});

app.post('/api/users/register', upload.single('profilePic'), async (req, res) => {
  await handleSignup(req, res);
});

// Login handler function
async function handleLogin(req, res) {
  try {
    let { mobileOrEmail, password, email } = req.body;
    
    // Support both mobileOrEmail and email fields
    if (!mobileOrEmail && email) {
      mobileOrEmail = email;
    }
    
    if (!mobileOrEmail || !password) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    mobileOrEmail = mobileOrEmail.trim();
    const isEmail = mobileOrEmail.includes('@');

    const user = isEmail
      ? await User.findOne({ email: mobileOrEmail })
      : await User.findOne({ mobile: mobileOrEmail.replace(/\D/g, '') });

    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid password" });

    const token = jwt.sign({ id: user._id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { 
        _id: user._id,
        name: user.name, 
        mobile: user.mobile, 
        email: user.email, 
        profilePic: user.profilePic,
        phone: user.mobile // For compatibility
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// LOGIN - Multiple endpoints for compatibility
app.post('/api/login', async (req, res) => {
  await handleLogin(req, res);
});

app.post('/api/auth/login', async (req, res) => {
  await handleLogin(req, res);
});

app.post('/api/users/login', async (req, res) => {
  await handleLogin(req, res);
});

// Signup handler function
async function handleSignup(req, res) {
  try {
    const { name, mobile, email, password, address, city, state, pincode } = req.body;
    if (!name || !mobile || !email || !password) {
      return res.status(400).json({ success: false, message: "All required fields must be filled" });
    }

    const normalizedMobile = mobile.replace(/\D/g, '');
    const existingUser = await User.findOne({ $or: [{ mobile: normalizedMobile }, { email }] });
    if (existingUser) return res.status(400).json({ success: false, message: "User already exists" });

    let profilePicUrl = null;
    if (req.file) profilePicUrl = await uploadToCloudinary(req.file.buffer, 'awaswala/profile');

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ 
      name, 
      mobile: normalizedMobile, 
      email, 
      password: hashedPassword, 
      profilePic: profilePicUrl, 
      address, 
      city, 
      state, 
      pincode 
    });

    await newUser.save();
    
    // Generate token for auto-login after signup
    const token = jwt.sign({ id: newUser._id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.json({ 
      success: true, 
      message: "Signup successful!", 
      token,
      user: { 
        _id: newUser._id,
        name, 
        mobile: normalizedMobile, 
        email, 
        profilePic: profilePicUrl,
        phone: normalizedMobile // For compatibility
      } 
    });

  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// ---------------- AGENT AUTH ROUTES ---------------- //

// Agent Signup - With Admin Approval System
app.post('/api/agent/auth/signup', upload.single('profilePic'), async (req, res) => {
  try {
    console.log('🔧 Agent signup request received:', req.body);
    console.log('📁 File received:', req.file ? `Yes - ${req.file.originalname}` : 'No');
    
    const { name, email, password, phone, aadharNumber, zone } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone || !aadharNumber || !zone) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate phone number (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be exactly 10 digits'
      });
    }

    // Validate Aadhar number (12 digits)
    const aadharRegex = /^\d{12}$/;
    if (!aadharRegex.test(aadharNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Aadhar number must be exactly 12 digits'
      });
    }

    // Check if agent already exists
    const existingAgent = await Agent.findOne({
      $or: [{ email: email.toLowerCase() }, { aadharNumber }, { phone }]
    });

    if (existingAgent) {
      console.log('❌ Agent already exists:', { email, aadharNumber, phone });
      let message = 'Agent already exists';
      if (existingAgent.email === email.toLowerCase()) {
        message = 'Agent with this email already exists';
      } else if (existingAgent.aadharNumber === aadharNumber) {
        message = 'Agent with this Aadhar number already exists';
      } else if (existingAgent.phone === phone) {
        message = 'Agent with this phone number already exists';
      }
      
      return res.status(400).json({
        success: false,
        message
      });
    }

    console.log('✅ Creating new agent with pending approval...');
    
    let profilePicUrl = '';
    
    // Upload profile picture to Cloudinary if provided
    if (req.file) {
      try {
        console.log('☁️ Uploading profile picture to Cloudinary...');
        
        // Convert buffer to base64
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        
        // Upload to Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(dataURI, {
          folder: 'awaswala/agents',
          resource_type: 'image',
          quality: 'auto',
          fetch_format: 'auto'
        });
        
        profilePicUrl = cloudinaryResponse.secure_url;
        console.log('✅ Profile picture uploaded to Cloudinary:', profilePicUrl);
        
      } catch (uploadError) {
        console.error('❌ Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading profile picture. Please try again.'
        });
      }
    }

    // Create new agent with pending status
    const newAgent = await Agent.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone,
      aadharNumber,
      zone,
      profilePic: profilePicUrl,
      isVerified: false, // Admin approve karega tab true hoga
      status: 'pending', // Default status - pending approval
      appliedAt: new Date()
    });

    console.log('✅ Agent application submitted successfully:', newAgent._id);

    // ADMIN KO NOTIFICATION BHEJNE KA CODE YAHA ADD KAR SAKTE HAIN
    console.log(`📧 Admin Notification: New agent application from ${newAgent.name} (${newAgent.email})`);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully! Your account will be activated after admin approval. You will receive an email notification once approved.',
      agent: {
        id: newAgent._id,
        name: newAgent.name,
        email: newAgent.email,
        phone: newAgent.phone,
        zone: newAgent.zone,
        profilePic: newAgent.profilePic,
        status: newAgent.status,
        appliedAt: newAgent.appliedAt
      }
      // Token nahi bhej rahe kyunki login approve hone ke baad hi hoga
    });

  } catch (error) {
    console.error('❌ Agent signup error:', error);
    
    // Specific error handling
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => ({
        field: e.path,
        message: e.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    if (error.code === 11000) {
      let message = 'Agent already exists';
      if (error.keyValue?.email) {
        message = 'Agent with this email already exists';
      } else if (error.keyValue?.aadharNumber) {
        message = 'Agent with this Aadhar number already exists';
      } else if (error.keyValue?.phone) {
        message = 'Agent with this phone number already exists';
      }
      
      return res.status(400).json({
        success: false,
        message
      });
    }

    // Multer file size error
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum 5MB allowed.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again.'
    });
  }
});

// Agent Login - With Admin Approval Check
app.post('/api/agent/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if agent exists
    const agent = await Agent.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!agent || !(await agent.correctPassword(password, agent.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check agent status before allowing login
    if (agent.status !== 'approved') {
      let message = '';
      
      switch (agent.status) {
        case 'pending':
          message = 'Your account is pending admin approval. Please wait for approval before logging in.';
          break;
        case 'rejected':
          message = 'Your application has been rejected.';
          if (agent.rejectionReason) {
            message += ` Reason: ${agent.rejectionReason}`;
          }
          break;
        case 'suspended':
          message = 'Your account has been suspended. Please contact admin for more information.';
          break;
        default:
          message = 'Your account is not approved for login.';
      }
      
      return res.status(403).json({
        success: false,
        message,
        status: agent.status,
        rejectionReason: agent.rejectionReason
      });
    }

    // Check if agent is verified (admin approved)
    if (!agent.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your account is not verified yet. Please contact admin.'
      });
    }

    // Generate token - Only for approved agents
    const token = jwt.sign({ 
      id: agent._id, 
      role: 'agent',
      email: agent.email
    }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    console.log(`✅ Agent login successful: ${agent.name} (${agent.email})`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        zone: agent.zone,
        profilePic: agent.profilePic,
        commissionRate: agent.commissionRate,
        totalEarnings: agent.totalEarnings,
        isVerified: agent.isVerified,
        status: agent.status,
        approvedAt: agent.approvedAt
      }
    });

  } catch (error) {
    console.error('Agent login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Get agent application status
app.get('/api/agent/application-status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const agent = await Agent.findOne({ email: email.toLowerCase() })
      .select('name email status isVerified rejectionReason appliedAt approvedAt');
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'No application found with this email'
      });
    }

    res.json({
      success: true,
      application: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        status: agent.status,
        isVerified: agent.isVerified,
        rejectionReason: agent.rejectionReason,
        appliedAt: agent.appliedAt,
        approvedAt: agent.approvedAt,
        message: getStatusMessage(agent.status, agent.rejectionReason)
      }
    });

  } catch (error) {
    console.error('Get application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper function for status messages
function getStatusMessage(status, rejectionReason) {
  switch (status) {
    case 'pending':
      return 'Your application is under review. We will notify you once approved.';
    case 'approved':
      return 'Your application has been approved! You can now login to your account.';
    case 'rejected':
      return `Your application has been rejected. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`;
    case 'suspended':
      return 'Your account has been suspended. Please contact admin.';
    default:
      return 'Application status unknown.';
  }
}

// Check if agent email exists (for frontend validation)
app.get('/api/agent/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const agent = await Agent.findOne({ email: email.toLowerCase() })
      .select('email status');
    
    if (agent) {
      return res.json({
        exists: true,
        email: agent.email,
        status: agent.status,
        message: agent.status === 'approved' ? 
          'Agent with this email already exists and is approved' :
          'Agent with this email already exists (pending approval)'
      });
    }

    res.json({
      exists: false,
      message: 'Email is available'
    });

  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});
// ---------------- ADMIN AGENT MANAGEMENT ROUTES ---------------- //

// Get all agents with filter (admin only)
app.get('/api/admin/agents', async (req, res) => {
  try {
    const { status } = req.query;
    
    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const agents = await Agent.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      agents,
      count: agents.length
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Approve agent (admin only)
app.put('/api/admin/agents/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    const agent = await Agent.findById(id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Update agent status
    agent.status = 'approved';
    agent.isVerified = true;
    agent.approvedAt = new Date();
    // agent.approvedBy = req.user.id; // Agar admin authentication hai toh

    await agent.save();

    // Yaha pe email notification bhej sakte hain agent ko

    res.json({
      success: true,
      message: 'Agent approved successfully',
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        status: agent.status,
        approvedAt: agent.approvedAt
      }
    });

  } catch (error) {
    console.error('Approve agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Reject agent (admin only)
app.put('/api/admin/agents/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const agent = await Agent.findById(id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Update agent status
    agent.status = 'rejected';
    agent.isVerified = false;
    agent.rejectionReason = reason;

    await agent.save();

    res.json({
      success: true,
      message: 'Agent application rejected',
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        status: agent.status
      }
    });

  } catch (error) {
    console.error('Reject agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Suspend agent (admin only)
app.put('/api/admin/agents/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    
    const agent = await Agent.findById(id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    agent.status = 'suspended';
    agent.isActive = false;

    await agent.save();

    res.json({
      success: true,
      message: 'Agent suspended successfully'
    });

  } catch (error) {
    console.error('Suspend agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get agent application status
app.get('/api/agent/application-status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const agent = await Agent.findOne({ email: email.toLowerCase() })
      .select('name email status isVerified rejectionReason appliedAt approvedAt');
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'No application found with this email'
      });
    }

    res.json({
      success: true,
      application: agent
    });

  } catch (error) {
    console.error('Get application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get current agent
app.get('/api/agent/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'agent') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token for agent access'
      });
    }

    const agent = await Agent.findById(decoded.id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    res.json({
      success: true,
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        zone: agent.zone,
        profilePic: agent.profilePic,
        commissionRate: agent.commissionRate,
        totalEarnings: agent.totalEarnings,
        pendingPayout: agent.pendingPayout,
        isVerified: agent.isVerified
      }
    });

  } catch (error) {
    console.error('Get agent error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// ---------------- USER PROFILE ROUTES ---------------- //

// GET LOGGED-IN USER - Multiple endpoints
app.get("/api/users/me", authMiddleware, async (req, res) => {
  await handleGetUser(req, res);
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  await handleGetUser(req, res);
});

app.get("/api/user/profile", authMiddleware, async (req, res) => {
  await handleGetUser(req, res);
});

async function handleGetUser(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        phone: user.mobile, // For compatibility
        profilePic: user.profilePic,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// UPDATE USER PROFILE
app.put("/api/users/profile", authMiddleware, upload.single('profilePic'), async (req, res) => {
  try {
    const { name, email, phone, address, city, state, pincode } = req.body;
    const updateData = { name, email, address, city, state, pincode };
    
    // Handle phone/mobile field
    if (phone) {
      updateData.mobile = phone.replace(/\D/g, '');
    }

    // Handle profile picture upload
    if (req.file) {
      updateData.profilePic = await uploadToCloudinary(req.file.buffer, 'awaswala/profile');
    }

    const user = await User.findByIdAndUpdate(
      req.user.id, 
      updateData, 
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        phone: user.mobile,
        profilePic: user.profilePic,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode
      }
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------- FORGET PASSWORD ---------------- //
app.post('/api/forget-password/request-otp', async (req, res) => {
  try {
    let { mobile } = req.body;
    if (!mobile) return res.status(400).json({ success: false, message: "Mobile required" });

    mobile = mobile.replace(/\D/g, '');
    if (mobile.length > 10) mobile = mobile.slice(-10);

    const user = await User.findOne({ mobile });
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage.set(mobile, { otp, expires: Date.now() + 5 * 60 * 1000 });

    await sendOTP(`+91${mobile}`, otp);
    res.json({ success: true, message: "OTP sent to your mobile" });
  } catch (err) {
    console.error("Forget password OTP error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Temporary route to verify all agents (testing ke liye)
app.post('/api/admin/verify-all-agents', async (req, res) => {
  try {
    await Agent.updateMany({}, { $set: { isVerified: true } });
    
    res.json({
      success: true,
      message: 'All agents verified successfully'
    });
  } catch (error) {
    console.error('Verify all agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all agents with details (debugging ke liye)
app.get('/api/admin/agents-debug', async (req, res) => {
  try {
    const agents = await Agent.find().select('name email isVerified createdAt');
    res.json({
      success: true,
      agents,
      count: agents.length
    });
  } catch (error) {
    console.error('Get agents debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ---------------- ADMIN ROUTES ---------------- //

// Get all users (landlords/tenants)
app.get('/api/admin/users', async (req, res) => {
  try {
    const { role } = req.query;
    
    const users = await User.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      users,
      count: users.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all rooms with filters
app.get('/api/admin/rooms', async (req, res) => {
  try {
    const { status } = req.query;
    
    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const rooms = await Room.find(filter)
      .populate('owner', 'name email mobile')
      .populate('verifiedBy', 'name email phone zone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      rooms,
      count: rooms.length
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update room status (admin)
app.put('/api/admin/rooms/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    room.status = status;
    await room.save();

    res.json({
      success: true,
      message: 'Room status updated successfully',
      room
    });
  } catch (error) {
    console.error('Update room status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete agent
app.delete('/api/admin/agents/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findByIdAndDelete(id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    res.json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get dashboard stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    const [
      totalAgents,
      pendingAgents,
      totalLandlords,
      pendingVerifications,
      totalRooms,
      verifiedRooms
    ] = await Promise.all([
      Agent.countDocuments(),
      Agent.countDocuments({ status: 'pending' }),
      User.countDocuments(),
      Verification.countDocuments({ status: 'Submitted' }),
      Room.countDocuments(),
      Room.countDocuments({ status: 'Verified' })
    ]);

    res.json({
      success: true,
      stats: {
        totalAgents,
        pendingAgents,
        totalLandlords,
        pendingVerifications,
        totalRooms,
        verifiedRooms
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ---------------- ADMIN AUTH ROUTES ---------------- //

// Admin Login
app.post('/api/admin/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Hardcoded admin credentials (production mein environment variables use karein)
    const ADMIN_CREDENTIALS = {
      username: 'awaswalaadminroot',
      password: 'password@123'
    };

    // Verify credentials
    if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Generate admin token
    const token = jwt.sign({ 
      id: 'admin-root',
      role: 'admin',
      username: ADMIN_CREDENTIALS.username
    }, process.env.JWT_SECRET, {
      expiresIn: "8h" // Admin sessions shorter for security
    });

    console.log(`✅ Admin login successful: ${ADMIN_CREDENTIALS.username}`);

    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: {
        id: 'admin-root',
        username: ADMIN_CREDENTIALS.username,
        role: 'admin',
        loginTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin login'
    });
  }
});

// Admin Auth Middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No admin token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is an admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid admin token'
    });
  }
};

// Protected admin route example
app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
  try {
    // Admin dashboard data fetch karein
    const stats = await getAdminStats();
    
    res.json({
      success: true,
      message: 'Admin dashboard data',
      stats,
      admin: req.admin
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper function for admin stats
async function getAdminStats() {
  const [
    totalAgents,
    pendingAgents,
    totalLandlords,
    pendingVerifications,
    totalRooms,
    verifiedRooms
  ] = await Promise.all([
    Agent.countDocuments(),
    Agent.countDocuments({ status: 'pending' }),
    User.countDocuments(),
    Verification.countDocuments({ status: 'Submitted' }),
    Room.countDocuments(),
    Room.countDocuments({ status: 'Verified' })
  ]);

  return {
    totalAgents,
    pendingAgents,
    totalLandlords,
    pendingVerifications,
    totalRooms,
    verifiedRooms
  };
}

app.post('/api/forget-password/verify-otp', async (req, res) => {
  try {
    let { mobile, otp } = req.body;
    mobile = mobile.replace(/\D/g, '');
    const record = otpStorage.get(mobile);
    if (!record) return res.status(400).json({ success: false, message: "OTP expired or not found" });
    if (Date.now() > record.expires) { otpStorage.delete(mobile); return res.status(400).json({ success: false, message: "OTP expired" }); }
    if (otp !== record.otp) return res.status(400).json({ success: false, message: "Invalid OTP" });

    otpStorage.delete(mobile);
    res.json({ success: true, message: "OTP verified" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post('/api/forget-password/reset', async (req, res) => {
  try {
    let { mobile, newPassword } = req.body;
    mobile = mobile.replace(/\D/g, '');
    if (!mobile || !newPassword) return res.status(400).json({ success: false, message: "All fields required" });

    const user = await User.findOne({ mobile });
    if (!user) return res.status(400).json({ success: false, message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------- ROOM UPLOAD ---------------- //
app.post('/api/rooms', upload.array('images', 10), async (req, res) => {
  try {
    const { title, rent, address, city, state, pin, description, ownerEmail } = req.body;

    if (!title || !rent || !address || !city || !state || !pin || !ownerEmail) {
      return res.status(400).json({ success: false, message: "All required fields must be filled" });
    }

    // Find user by email
    const ownerUser = await User.findOne({ email: ownerEmail });
    if (!ownerUser) return res.status(400).json({ success: false, message: "Owner not found" });

    // Upload images
    let uploadedImages = [];
    if (req.files && req.files.length > 0) {
      uploadedImages = await Promise.all(
        req.files.map(file => uploadToCloudinary(file.buffer, 'awaswala/rooms'))
      );
    }

    // Generate Room ID
    const year = new Date().getFullYear();
    const count = await Room.countDocuments({
      createdAt: { $gte: new Date(`${year}-01-01`) }
    });
    const serial = String(count + 1).padStart(5, '0');
    const roomId = `RA${year}${serial}`;

    // Create Room with owner as ObjectId
    const newRoom = new Room({
      roomId,
      title,
      rent,
      address,
      city,
      state,
      pin,
      description,
      images: uploadedImages,
      owner: ownerUser._id,
      status: "Pending"
    });

    await newRoom.save();

    res.json({ success: true, message: "Room uploaded successfully", roomId, room: newRoom });
  } catch (err) {
    console.error("Room upload error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------- GET USER ROOMS ---------------- //
app.get('/api/my-rooms/:userKey', async (req, res) => {
  try {
    const { userKey } = req.params;
    if (!userKey) return res.status(400).json({ success: false, message: "User ID/Email is required" });

    let query = {};
    if (/^[0-9a-fA-F]{24}$/.test(userKey)) {
      query = { owner: userKey };
    } else {
      // Find user by email and get their ID
      const user = await User.findOne({ email: userKey });
      if (!user) return res.status(404).json({ success: false, message: "User not found" });
      query = { owner: user._id };
    }

    const rooms = await Room.find(query)
      .select("roomId title rent address city state pin images status createdAt")
      .sort({ createdAt: -1 });

    res.json({ success: true, rooms });
  } catch (err) {
    console.error("Fetch rooms error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------- GET ALL ROOMS ---------------- //
app.get('/api/rooms', async (req, res) => {
  try {
    const { status } = req.query; // optional ?status=Verified
    let query = {};
    if (status) {
      query.status = status;
    }

    const rooms = await Room.find(query)
      .populate("owner", "name email mobile") // owner details (optional)
      .sort({ createdAt: -1 });

    res.json({ success: true, rooms });
  } catch (err) {
    console.error("Fetch all rooms error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------- GET SINGLE ROOM DETAILS ---------------- //
app.get('/api/room/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: "Room not found" });
    res.json({ success: true, room });
  } catch (err) {
    console.error("Room details error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------- AGENT ROOM ROUTES ---------------- //

// Get rooms for agent (pending, verified, cancelled) - MISSING ROUTE ADDED
app.get('/api/agent/rooms', authenticateAgent, async (req, res) => {
  try {
    const { status } = req.query;
    
    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    console.log('🔄 Fetching rooms for agent:', req.agent.name, 'Filter:', filter);

    const rooms = await Room.find(filter)
      .populate('owner', 'name email mobile')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${rooms.length} rooms for agent`);

    res.json({
      success: true,
      rooms,
      count: rooms.length
    });

  } catch (error) {
    console.error('Get agent rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching rooms'
    });
  }
});

// Submit room verification - FIXED WITH BETTER ERROR HANDLING
app.post('/api/agent/verify-room', authenticateAgent, upload.fields([
  { name: 'aadhar', maxCount: 1 },
  { name: 'electricityBill', maxCount: 1 },
  { name: 'ownerPhoto', maxCount: 1 },
  { name: 'roomPhotos', maxCount: 10 }
]), async (req, res) => {
  try {
    console.log('🔄 Starting room verification process...');
    
    const { roomId } = req.body;
    
    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    console.log('🔍 Looking for room:', roomId);

    const room = await Room.findById(roomId).populate('owner', 'name email mobile');
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    console.log('✅ Room found:', room.roomId, room.title);

    // Check if files are uploaded
    if (!req.files) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    console.log('📁 Files received:', {
      aadhar: req.files.aadhar ? 'Yes' : 'No',
      electricityBill: req.files.electricityBill ? 'Yes' : 'No',
      ownerPhoto: req.files.ownerPhoto ? 'Yes' : 'No',
      roomPhotos: req.files.roomPhotos ? req.files.roomPhotos.length + ' files' : 'No'
    });

    // Upload verification documents with better error handling
    let aadharUrl = null;
    let electricityBillUrl = null;
    let ownerPhotoUrl = null;
    let roomPhotosUrls = [];

    try {
      if (req.files.aadhar && req.files.aadhar[0]) {
        console.log('📁 Uploading Aadhar to Cloudinary...');
        aadharUrl = await uploadToCloudinary(req.files.aadhar[0].buffer, 'awaswala/verification/aadhar');
        console.log('✅ Aadhar uploaded:', aadharUrl);
      }

      if (req.files.electricityBill && req.files.electricityBill[0]) {
        console.log('📁 Uploading Electricity Bill to Cloudinary...');
        electricityBillUrl = await uploadToCloudinary(req.files.electricityBill[0].buffer, 'awaswala/verification/electricity');
        console.log('✅ Electricity Bill uploaded:', electricityBillUrl);
      }

      if (req.files.ownerPhoto && req.files.ownerPhoto[0]) {
        console.log('📁 Uploading Owner Photo to Cloudinary...');
        ownerPhotoUrl = await uploadToCloudinary(req.files.ownerPhoto[0].buffer, 'awaswala/verification/owner');
        console.log('✅ Owner Photo uploaded:', ownerPhotoUrl);
      }

      if (req.files.roomPhotos && req.files.roomPhotos.length > 0) {
        console.log(`📁 Uploading ${req.files.roomPhotos.length} room photos to Cloudinary...`);
        roomPhotosUrls = await Promise.all(
          req.files.roomPhotos.map((file, index) => {
            console.log(`📸 Uploading room photo ${index + 1}...`);
            return uploadToCloudinary(file.buffer, 'awaswala/verification/rooms');
          })
        );
        console.log(`✅ ${roomPhotosUrls.length} room photos uploaded`);
      }
    } catch (uploadError) {
      console.error('❌ Cloudinary upload error:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Error uploading documents to cloud storage'
      });
    }

    // Validate that required documents are uploaded
    if (!aadharUrl || !electricityBillUrl || !ownerPhotoUrl || roomPhotosUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All required documents must be uploaded',
        missing: {
          aadhar: !aadharUrl,
          electricityBill: !electricityBillUrl,
          ownerPhoto: !ownerPhotoUrl,
          roomPhotos: roomPhotosUrls.length === 0
        }
      });
    }

    // Create verification record with agent and room details
    const verification = new Verification({
      roomId,
      agentId: req.agent._id,
      // Agent details
      agentName: req.agent.name,
      agentEmail: req.agent.email,
      agentPhone: req.agent.phone,
      agentZone: req.agent.zone,
      // Room details
      roomNumber: room.roomId,
      roomTitle: room.title,
      roomRent: room.rent,
      roomLocation: `${room.city}, ${room.state}`,
      // Verification documents
      aadharDoc: aadharUrl,
      electricityBillDoc: electricityBillUrl,
      ownerPhoto: ownerPhotoUrl,
      roomPhotos: roomPhotosUrls,
      status: "Submitted"
    });

    await verification.save();
    console.log('✅ Verification record created:', verification._id);

    // Update room status to "Processed"
    room.status = 'Processed';
    room.verifiedBy = req.agent._id;
    room.verificationDate = new Date();
    await room.save();

    console.log(`✅ Room ${room.roomId} status updated to Processed by agent ${req.agent.name}`);

    res.json({
      success: true,
      message: 'Room verification submitted successfully',
      verificationId: verification._id,
      roomStatus: room.status
    });

  } catch (error) {
    console.error('❌ Verify room error:', error);
    
    // More specific error handling
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + error.message
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during verification: ' + error.message
    });
  }
});

// Update room status - FIXED STATUS VALIDATION
// Update room status - FIXED WITH CANCELLED STATUS
app.put('/api/agent/rooms/:roomId/status', authenticateAgent, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { status } = req.body;
    
    console.log('🔄 Updating room status:', { roomId, status });

    // Validate status - CANCELLED ADD KARO
    const allowedStatuses = ['Pending', 'Processed', 'Under Review', 'Verified', 'Cancelled', 'Rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status: ${status}. Allowed: ${allowedStatuses.join(', ')}`
      });
    }

    // Find room and update status
    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Update room status
    room.status = status;
    
    // Agar cancelled hai toh timestamp set karo
    if (status === 'Cancelled') {
      room.cancelledAt = new Date();
    }
    
    // Agar verified hai toh agent aur date set karo
    if (status === 'Verified') {
      room.verifiedBy = req.agent._id;
      room.verificationDate = new Date();
    }
    
    await room.save();

    console.log(`✅ Room ${roomId} status updated to ${status} by agent ${req.agent.name}`);

    res.json({
      success: true,
      message: `Room status updated to ${status}`,
      room: {
        id: room._id,
        title: room.title,
        status: room.status,
        verifiedBy: room.verifiedBy,
        verificationDate: room.verificationDate,
        cancelledAt: room.cancelledAt
      }
    });

  } catch (error) {
    console.error('Room status update error:', error);
    
    // Specific error handling
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error updating room status: ' + error.message
    });
  }
});

// Get agent stats
app.get('/api/agent/stats', authenticateAgent, async (req, res) => {
  try {
    const pendingCount = await Room.countDocuments({ status: 'Pending' });
    const verifiedCount = await Room.countDocuments({ status: 'Verified' });
    const cancelledCount = await Room.countDocuments({ status: 'Cancelled' });

    res.json({
      success: true,
      stats: {
        pending: pendingCount,
        verified: verifiedCount,
        cancelled: cancelledCount
      }
    });
  } catch (error) {
    console.error('Get agent stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all verification records (for admin)
app.get('/api/admin/verifications', async (req, res) => {
  try {
    const { status } = req.query;
    
    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const verifications = await Verification.find(filter)
      .populate('roomId', 'roomId title rent address city state images')
      .populate('agentId', 'name email phone zone')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      verifications,
      count: verifications.length
    });

  } catch (error) {
    console.error('Get verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get verification by ID
app.get('/api/admin/verifications/:id', async (req, res) => {
  try {
    const verification = await Verification.findById(req.params.id)
      .populate('roomId', 'roomId title rent address city state images owner')
      .populate('agentId', 'name email phone zone')
      .populate('roomId.owner', 'name email phone');

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification record not found'
      });
    }

    res.json({
      success: true,
      verification
    });

  } catch (error) {
    console.error('Get verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update verification status (admin only)
app.put('/api/admin/verifications/:id/status', async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;
    const { id } = req.params;

    const verification = await Verification.findById(id);
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification record not found'
      });
    }

    // Update verification status
    verification.status = status;
    verification.reviewedAt = new Date();
    if (reviewNotes) {
      verification.reviewNotes = reviewNotes;
    }

    await verification.save();

    // Update room status based on verification result
    const room = await Room.findById(verification.roomId);
    if (room) {
      if (status === 'Approved') {
        room.status = 'Verified';
      } else if (status === 'Rejected') {
        room.status = 'Rejected';
      }
      await room.save();
    }

    res.json({
      success: true,
      message: `Verification ${status.toLowerCase()} successfully`,
      verification,
      roomStatus: room?.status
    });

  } catch (error) {
    console.error('Update verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get agent's verification submissions
app.get('/api/agent/verifications', authenticateAgent, async (req, res) => {
  try {
    const verifications = await Verification.find({ agentId: req.agent._id })
      .populate('roomId', 'roomId title rent city state')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      verifications,
      count: verifications.length
    });

  } catch (error) {
    console.error('Get agent verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ---------------- ADMIN AGENT MANAGEMENT ---------------- //

// Get all agents (for admin)
app.get('/api/admin/agents', async (req, res) => {
  try {
    const agents = await Agent.find().select('-password');
    res.json({
      success: true,
      agents
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Verify agent (admin only)
app.put('/api/admin/agents/:id/verify', async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    agent.isVerified = true;
    await agent.save();

    res.json({
      success: true,
      message: 'Agent verified successfully'
    });
  } catch (error) {
    console.error('Verify agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ---------------- DEBUG ROUTES ---------------- //

// Debug route to check all agent routes
app.get('/api/debug/agent-routes', (req, res) => {
  const agentRoutes = [
    'GET /api/agent/rooms',
    'POST /api/agent/verify-room', 
    'PUT /api/agent/rooms/:roomId/status',
    'GET /api/agent/auth/me',
    'GET /api/agent/verifications',
    'GET /api/agent/stats'
  ];
  
  res.json({
    success: true,
    message: 'Available agent routes',
    routes: agentRoutes
  });
});

// Test agent authentication
app.get('/api/debug/agent-test', authenticateAgent, (req, res) => {
  res.json({
    success: true,
    message: 'Agent authentication working',
    agent: {
      id: req.agent._id,
      name: req.agent.name,
      email: req.agent.email
    }
  });
});

// Debug route to check room details
app.get('/api/debug/room/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      room: {
        id: room._id,
        roomId: room.roomId,
        title: room.title,
        status: room.status,
        owner: room.owner,
        verifiedBy: room.verifiedBy
      }
    });
  } catch (error) {
    console.error('Debug room error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ---------------- SERVER ---------------- //
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));