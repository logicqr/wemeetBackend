
const express = require("express")
const app = express()
var cors = require("cors")
app.use(cors())
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()
app.use(express.json())


app.post("/register-company", async (req, res) => {
    const data = req.body;
    const registerCompany = await prisma.company.create({
        data: {
            companyName: data.companyName
        }
    })
    res.json(registerCompany)
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
        position:true,
        role: true,
      },
    });

    res.json(getAllUser);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/add-user', async (req, res) => {
    const data = req.body;
    const addUser = await prisma.user.create({
        data: {
            userName: data.userName,
            email: data.email,
            position:data.position,
            role: data.role,
            companyId: data.companyId
        }
    })
    res.json(addUser)
})

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
        include:{
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
app.post('/attendance/check-in', async (req, res) => {
  const { userId, latitude, longitude } = req.body;
  const today = new Date();
  const dateOnly = new Date(today.toDateString());

  try {
    const existing = await prisma.attendance.findFirst({
      where: { userId, date: dateOnly },
    });

    if (existing) {
      return res.status(400).json({ message: 'Already checked in today.' });
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        date: dateOnly,
        checkIn: today,
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

// Check-out
app.post('/attendance/check-out', async (req, res) => {
  const { userId } = req.body;
  const today = new Date();
  const dateOnly = new Date(today.toDateString());

  try {
    const attendance = await prisma.attendance.updateMany({
      where: { userId, date: dateOnly },
      data: { checkOut: today },
    });

    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check out.' });
  }
});

// Leave Request
app.post('/leave-request', async (req, res) => {
  const { userId, startDate, endDate, reason } = req.body;

  try {
    const leave = await prisma.leaveRequest.create({
      data: {
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
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

// Create Attendance
app.post('/attendance/check-in', async (req, res) => {
  const { userId, location } = req.body;
  const today = new Date();
  const dateOnly = new Date(today.toDateString());

  try {
    const existing = await prisma.attendance.findFirst({
      where: { userId, date: dateOnly },
    });

    if (existing) {
      return res.status(400).json({ message: 'Already checked in today.' });
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        date: dateOnly,
        checkIn: today,
        location,
        status: 'PRESENT',
      },
    });

    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check in.' });
  }
});

// Leave Request
app.post('/leave-request', async (req, res) => {
  const { userId, startDate, endDate, reason } = req.body;

  try {
    const leave = await prisma.leaveRequest.create({
      data: {
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
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

app.listen(8000, () => {
    console.log("Server Started")
})