
const express = require("express")
const app = express()
var cors = require("cors")
app.use(cors())
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()
app.use(express.json())
var jwt = require('jsonwebtoken');

app.post("/plans",async(req,res)=>{
  const data = req.body;
  const createPlan = await prisma.plans.create({
    data:{
      plan:data.plan,
      price:data.price
    }
  })
  res.json({
    createPlan
  })
})

app.get("/plans",async(req,res)=>{
  const allPlans = await prisma.plans.findMany()
  res.json(allPlans)
})

// app.post("/create-order", async (req, res) => {
//   const data = req.body;

//   try {
//     const order = await razorpay.orders.create({
//       amount: (data.amount) * 100, // ₹499 => 49900 paise
//       currency: "INR",
//     });
//     const tempData = await prisma.tempregistration.create({
//       data: {
//         companyName: data.companyName,
//         userName: data.userName,
//         email: data.email,
//         password: data.email,
//         position: data.position,
//         orderId: order.id
//       }
//     })
//     res.json({ success: true, order });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Payment order creation failed" });
//   }
// });

// app.post("/payment-verify", async (req, res) => {
// try{
//   console.log('🔹 Webhook Received!');

//   const webhookBody = req.rawBody;
//   if (!webhookBody) {
//     console.log('❌ Missing Raw Body!');
//     return res.status(400).json({ message: 'Invalid webhook request' });
//   }

//   const webhookSecret = config.RAZORPAY_KEY_SECRET;
//   const webhookSignature = req.headers['x-razorpay-signature'];

//   console.log('🔹 Received Signature:', webhookSignature);
//   console.log('🔹 Expected Secret:', webhookSecret);

//   if (!webhookSecret || !webhookSignature) {
//     console.log('❌ Missing Secret or Signature');
//     return res.status(400).json({ message: 'Invalid webhook request' });
//   }

//   // Verify Signature
//   const expectedSignature = crypto
//     .createHmac('sha256', webhookSecret)
//     .update(webhookBody) // Ensure raw body is used
//     .digest('hex');

//   console.log('🔹 Computed Signature:', expectedSignature);

//   if (expectedSignature !== webhookSignature) {
//     console.log('❌ Invalid Signature!');
//     return res.status(400).json({ message: 'Invalid webhook signature' });
//   }

//   // Parse Webhook Event
//   const event = JSON.parse(webhookBody);


//   switch (event.event) {
//     case "payment.captured": {
//       const paymentDetails = event.payload.payment.entity;
//       const orderId = paymentDetails.order_id;
//       const paymentId = paymentDetails.id;
//       const amount = paymentDetails.amount / 100;

//       console.log("✅ Payment Captured:", { orderId, paymentId, amount });
//     }
//       if (!tempData) {
//         console.log("❌ Temp Order Not Found!");
//         return res.status(404).json({ message: "Temporary order not found" });
//       }
//       const tempData = await prisma.tempregistration.findUnique({
//         where: {
//           orderId
//         }
//       })


//       const companyRegister = await prisma.company.create({
//         data: {
//           companyName: tempData.companyName
//         }
//       })

//       const companySuperAdmin = await prisma.user.create({
//         data: {
//           userName: tempData.userName,
//           email: tempData.email,
//           position: tempData.position,
//           password: tempData.password,
//           role: "SUPER_ADMIN",
//           companyId: companyRegister.companyId
//         }
//       })

//       await prisma.tempregistration.delete({ where: { orderId } })
//       res.json({
//         companySuperAdmin
//       })
  
//   case "payment.failed": {
//     console.log("❌ Payment Failed:", event.payload.payment.entity);
//     return res.status(200).json({ message: "Payment failed event logged" });
// }

// default:
//     console.log("⚠️ Unhandled Event Type:", event.event);
//     return res.status(200).json({ message: "Unhandled event" });
//     }
// } catch (error) {
//   console.error("🔥 Webhook Processing Error:", error);
//   return res.status(500).json({ message: "Internal server error" });
// }})

app.post("/super-admin",async(req,res)=>{
  const data = req.body;

  const companyRegister = await prisma.company.create({
    data: {
      companyName: data.companyName
    }
  })

  const companySuperAdmin = await prisma.user.create({
    data: {
      userName: data.userName,
      email: data.email,
      position: data.position,
      password: data.password,
      role: "SUPER_ADMIN",
      companyId: companyRegister.companyId
    }
  })
  res.json({
    companySuperAdmin
  })
})

app.post("/add-user", async (req, res) => {
  const data = req.body;
  const isExistingUser = await prisma.user.findUnique({
    where: {
      email: data.email
    }
  })
  if (isExistingUser) {
    return res.status(400).json({ message: "User Already Exists" });
  }
  const creatingUser = await prisma.user.create({
    data: {
      userName: data.userName,
      email: data.email,
      position: data.position,
      role: data.role,
      password: data.password,
      companyId: data.companyId
    }
  })
  res.json({
    data: creatingUser
  })
})

app.post("/login", async (req, res) => {
  const data = req.body;
  const isExistingUser = await prisma.user.findUnique({
    where: {
      email: data.email
    }
  })
  if (!isExistingUser) {
    return res.status(404).json({ message: "User not found. Contact support for assistance." });
  }
  if (data.password !== isExistingUser.password) {
    return res.status(400).json({ message: "Invalid username or password" });
  }

  const accessToken = jwt.sign({ userId: isExistingUser.userId, role:isExistingUser.role },
     'wemeet',
     {expiresIn:"1h"});

  const refreshToken = jwt.sign({ userId: isExistingUser.userId, role:isExistingUser.role },
        'wemeet',
        {expiresIn:"30d"});

        await prisma.token.create({
          data:{
            refreshToken:refreshToken
          }
        })


  return res.status(200).json({
    message: "Successfully logged in",
    token:{
      accessToken,
      refreshToken
    }
  });
})

app.post('/refresh',async(req,res)=>{
  const data = req.body;
  const tokenValid = await prisma.token.findFirst({
    where:{
      refreshToken:data.refreshToken
    }
  })
  if(tokenValid){
    jwt.verify(token, 'wemeet', function(err,decoded) {
      if(!err){
        const accessToken = jwt.sign({ userId: tokenValid.userId, role:decoded.role },
          'wemeet',
          {expiresIn:"1h"});
          res.json({accessToken})
      }else{
        res.json({
            message: "User Not Authenticated"
        })
      }
    });
  }else{
    res.json({
      message:"Token Not Found"
    })
  }
})

app.post("/all-users", async (req, res) => {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: "companyId is required" });
    }

    const getAllUser = await prisma.user.findMany({
      where: {
        companyId: companyId,
      },
      select: {
        userId: true,
        userName: true,
        position: true,
        role: true,
      },
    });

    res.json(getAllUser);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/my-meetings", async (req, res) => {
  try {
    const { userId } = req.body; // or req.user if using auth middleware

    const meetings = await prisma.meeting.findMany({
      where: {
        participant: {
          some: { userId } // You were added to it
        }
      },
      orderBy: {
        scheduledAt: "desc"
      },
      include: {
        user: true,
      }
    });

    res.json(meetings);
  } catch (error) {
    console.error("Failed to get user meetings:", error);
    res.status(500).json({ error: "Failed to get meetings" });
  }
});

app.post("/meetings", async (req, res) => {
  try {
    const { userId, title, description, scheduledAt, link, participantIds } = req.body;

    const meeting = await prisma.meeting.create({
      data: {
        title,
        description,
        scheduledAt,
        link,
        userId,
        // createdBy:user.userName,
        // createdPosition:user.position,
        participant: {
          create: participantIds.map(userId => ({
            user: { connect: { userId } }
          }))
        }
      },
      include: {
        // user: true, 
        participant: {
          include: { user: true }
        }
      }
    });

    res.status(201).json(meeting);
  } catch (error) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ error: "Failed to create meeting" });
  }
});

// Create Attendance
// Attendance - Check-in
app.post('/attendance/check-in', async (req, res) => {
  const { userId, latitude, longitude } = req.body;
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));

  try {
    const existing = await prisma.attendance.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ message: 'Already checked in today.' });
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        date: new Date(),
        checkIn: new Date(),
        latitude,
        longitude,
        status: 'PRESENT',
      },
    });

    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check in.' });
  }
});

// Attendance - Check-out
app.post('/attendance/check-out', async (req, res) => {
  const { userId } = req.body;
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));

  try {
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No check-in found for today.' });
    }

    const updated = await prisma.attendance.update({
      where: { attendanceId: attendance.attendanceId }, // ✅ make sure this exists and is used
      data: { checkOut: new Date() },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check out.' });
  }
});

// Attendance - Status
app.post('/attendance/status', async (req, res) => {
  const { userId } = req.body;
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));

  try {
    const attendanceStatus = await prisma.attendance.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    res.json({ attendanceStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get status.' });
  }
});

// Leave Request
app.post('/leave-request', async (req, res) => {
  const data = req.body;
  console.log(data)
  try {
    const leave = await prisma.leaveRequest.create({
      data: {
        userId:data.userId,
        startDate: data.startDate,
        endDate: data.endDate,
        reason:data.reason,
      },
    });
    res.json(leave);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit leave request.' });
  }
});

// Approve or Reject Leave
app.post('/leave-status', async (req, res) => {
  const { leaveId, status, approvedBy } = req.body;

  try {
    const updated = await prisma.leaveRequest.update({
      where: { leaveId },
      data: { status, approvedBy },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update leave status.' });
  }
});

app.post('/leave',async(req,res)=>{
  const data = req.body;
  const leaveReport = await prisma.leaveRequest.findFirst({
      where:{
        userId:data.userId
      }
  })
  res.json({leaveReport})
})

app.post('/report', async (req, res) => {
  const { userId, workDetails } = req.body;
  const today = new Date();
  const dateOnly = new Date(today.toDateString());

  try {
    const report = await prisma.dailyReport.create({
      data: {
        userId,
        workDetails,
        date: dateOnly,
        checkOut: today,
      },
    });
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit report.' });
  }
});

// Get Late Comers
app.post('/late-comers', async (req, res) => {
  const { companyId, date } = req.body;
  const selectedDate = new Date(date);

  try {
    const lateComers = await prisma.attendance.findMany({
      where: {
        date: selectedDate,
        checkIn: {
          gt: new Date(`${date}T09:30:00.000Z`),
        },
        user: {
          companyId,
        },
      },
      include: { user: true },
    });
    res.json(lateComers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch late comers.' });
  }
});

// Auto-mark absent (run with cron job)
app.post('/auto-absent', async (req, res) => {
  const { date } = req.body;
  const targetDate = new Date(date);

  try {
    const staff = await prisma.user.findMany({ where: { role: 'STAFF' } });
    for (const user of staff) {
      const hasAttendance = await prisma.attendance.findFirst({
        where: {
          userId: user.userId,
          date: targetDate,
        },
      });
      if (!hasAttendance) {
        await prisma.attendance.create({
          data: {
            userId: user.userId,
            date: targetDate,
            status: 'ABSENT',
          },
        });
      }
    }
    res.json({ message: 'Auto absent marking completed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed auto-absent marking.' });
  }
});



// app.post("/create-meeting",async (req, res) => {
//     const data = req.body;
//     const createMeeting = await prisma.meeting.create({
//         data: {
//             title: data.title,
//             description: data.description,
//             scheduledAt: data.scheduledAt,
//             userId: data.userId,
//             participant: {
//                 create: participantIds.map(id => ({
//                   user: { connect: { userId: id } }
//                 }))
//               }
//             },
//             include: {
//               participant: {
//                 include: { user: true }
//               }
//             }
//     })
//     res.json(createMeeting)
// })



// Daily Report



app.listen(8000, () => {
  console.log("Server Started")
})