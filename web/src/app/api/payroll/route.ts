import { NextRequest, NextResponse } from 'next/server';import { NextRequest, NextResponse } from 'next/server'

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';export async function GET(request: NextRequest) {

import { prisma } from '@/lib/prisma';  const { searchParams } = new URL(request.url)

  const workerId = searchParams.get('workerId')

/**  const restaurantId = searchParams.get('restaurantId')

 * POST /api/payroll/process  const payPeriod = searchParams.get('payPeriod') // e.g., "2024-01-15" for week ending

 * Process payroll payments for workers  const type = searchParams.get('type') // 'timesheet' | 'payroll' | 'summary'

 */

export async function POST(request: NextRequest) {  if (workerId && type === 'timesheet') {

  try {    // Return worker's timesheet data

    const session = await getServerSession(authOptions);    return NextResponse.json({

      timesheets: [

    if (!session?.user || session.user.role !== 'RESTAURANT_OWNER') {        {

      return NextResponse.json(          id: "ts_001",

        { error: 'Unauthorized' },          workerId: workerId,

        { status: 401 }          shiftId: "shift_123",

      );          date: "2024-01-22",

    }          clockIn: "2024-01-22T09:00:00Z",

          clockOut: "2024-01-22T17:00:00Z",

    const { workerIds, payPeriodStart, payPeriodEnd } = await request.json();          breakStart: "2024-01-22T13:00:00Z",

          breakEnd: "2024-01-22T13:30:00Z",

    if (!workerIds || !Array.isArray(workerIds) || workerIds.length === 0) {          totalHours: 7.5,

      return NextResponse.json(          overtimeHours: 0,

        { error: 'Worker IDs are required' },          hourlyRate: 18.50,

        { status: 400 }          tips: 45.20,

      );          grossPay: 138.75,

    }          status: "APPROVED",

          restaurant: "Downtown Bistro",

    // Get restaurant with payment info          jobTitle: "Server",

    const restaurant = await prisma.restaurant.findUnique({          notes: "Busy lunch shift"

      where: { userId: session.user.id },        },

      include: { paymentInfo: true }        {

    });          id: "ts_002", 

          workerId: workerId,

    if (!restaurant) {          shiftId: "shift_124",

      return NextResponse.json(          date: "2024-01-23",

        { error: 'Restaurant not found' },          clockIn: "2024-01-23T10:00:00Z",

        { status: 404 }          clockOut: "2024-01-23T18:30:00Z",

      );          breakStart: "2024-01-23T14:00:00Z",

    }          breakEnd: "2024-01-23T14:30:00Z",

          totalHours: 8.0,

    if (!restaurant.paymentInfo?.stripeAccountId) {          overtimeHours: 0,

      return NextResponse.json(          hourlyRate: 18.50,

        { error: 'Stripe account not connected' },          tips: 62.80,

        { status: 400 }          grossPay: 148.00,

      );          status: "PENDING_APPROVAL",

    }          restaurant: "Downtown Bistro",

          jobTitle: "Server"

    // Get timesheets for the pay period        },

    const timesheets = await prisma.timesheet.findMany({        {

      where: {          id: "ts_003",

        userId: { in: workerIds },          workerId: workerId,

        date: {          shiftId: "shift_125", 

          gte: new Date(payPeriodStart),          date: "2024-01-24",

          lte: new Date(payPeriodEnd)          clockIn: "2024-01-24T16:00:00Z",

        }          clockOut: "2024-01-25T00:30:00Z",

      },          breakStart: "2024-01-24T20:00:00Z",

      include: {          breakEnd: "2024-01-24T20:30:00Z",

        user: {          totalHours: 8.0,

          select: {          overtimeHours: 0.5,

            id: true,          hourlyRate: 18.50,

            name: true,          tips: 78.40,

            email: true          grossPay: 162.25,

          }          status: "APPROVED",

        }          restaurant: "Downtown Bistro",

      }          jobTitle: "Server",

    });          notes: "Weekend dinner rush"

        }

    // Calculate total hours and wages per worker      ],

    const payrollData = workerIds.map(workerId => {      weekSummary: {

      const workerTimesheets = timesheets.filter(ts => ts.userId === workerId);        totalHours: 23.5,

      const totalHours = workerTimesheets.reduce((sum, ts) => sum + (ts.hoursWorked || 0), 0);        regularHours: 23.0,

      const totalWages = workerTimesheets.reduce((sum, ts) => sum + (ts.totalPay || 0), 0);        overtimeHours: 0.5,

              totalTips: 186.40,

      const worker = workerTimesheets[0]?.user;        grossPay: 448.00,

              estimatedTaxes: 67.20,

      return {        netPay: 380.80,

        workerId,        payPeriodStart: "2024-01-22",

        workerName: worker?.name || 'Unknown',        payPeriodEnd: "2024-01-28"

        workerEmail: worker?.email || '',      }

        totalHours,    })

        totalWages,  }

        timesheetCount: workerTimesheets.length

      };  if (workerId && type === 'payroll') {

    });    // Return worker's payroll history

    return NextResponse.json({

    // In a real implementation, this would process payments via Stripe      payHistory: [

    // For now, we'll simulate successful payment processing        {

    const payments = await Promise.all(          id: "pay_001",

      payrollData.map(async (worker) => {          payPeriodStart: "2024-01-15",

        if (worker.totalWages > 0) {          payPeriodEnd: "2024-01-21", 

          // Simulate Stripe payment processing          totalHours: 32.0,

          const paymentId = 'pay_' + Math.random().toString(36).substring(2, 15);          regularHours: 32.0,

                    overtimeHours: 0,

          // Create payment record (you might want to add a Payment model to your schema)          hourlyRate: 18.50,

          return {          basePay: 592.00,

            paymentId,          tips: 234.60,

            workerId: worker.workerId,          bonuses: 50.00,

            workerName: worker.workerName,          grossPay: 876.60,

            amount: worker.totalWages,          federalTax: 105.19,

            hours: worker.totalHours,          stateTax: 43.83,

            status: 'completed',          socialSecurity: 54.35,

            processedAt: new Date().toISOString()          medicare: 12.71,

          };          totalDeductions: 216.08,

        }          netPay: 660.52,

        return null;          payDate: "2024-01-26",

      })          status: "PAID",

    );          paymentMethod: "DIRECT_DEPOSIT"

        },

    const successfulPayments = payments.filter(Boolean);        {

          id: "pay_002",

    return NextResponse.json({          payPeriodStart: "2024-01-22",

      success: true,          payPeriodEnd: "2024-01-28",

      message: `Successfully processed ${successfulPayments.length} payments`,          totalHours: 23.5,

      payments: successfulPayments,          regularHours: 23.0, 

      totalAmount: successfulPayments.reduce((sum, p) => sum + (p?.amount || 0), 0),          overtimeHours: 0.5,

      payPeriod: {          hourlyRate: 18.50,

        start: payPeriodStart,          basePay: 425.50,

        end: payPeriodEnd          tips: 186.40,

      }          bonuses: 0,

    });          grossPay: 611.90,

          federalTax: 73.43,

  } catch (error) {          stateTax: 30.60,

    console.error('Payroll processing error:', error);          socialSecurity: 37.94,

    return NextResponse.json(          medicare: 8.87,

      { error: 'Internal server error' },          totalDeductions: 150.84,

      { status: 500 }          netPay: 461.06,

    );          payDate: "2024-02-02",

  }          status: "PROCESSING",

}          paymentMethod: "DIRECT_DEPOSIT"

        }

/**      ],

 * GET /api/payroll/history      yearToDateSummary: {

 * Get payroll payment history        totalGrossPay: 1488.50,

 */        totalNetPay: 1121.58,

export async function GET(request: NextRequest) {        totalTaxes: 366.92,

  try {        totalHours: 55.5,

    const session = await getServerSession(authOptions);        avgHourlyEarnings: 26.83 // including tips

      }

    if (!session?.user || session.user.role !== 'RESTAURANT_OWNER') {    })

      return NextResponse.json(  }

        { error: 'Unauthorized' },

        { status: 401 }  if (restaurantId && type === 'payroll') {

      );    // Return restaurant payroll overview

    }    return NextResponse.json({

      payrollOverview: {

    const { searchParams } = new URL(request.url);        currentPayPeriod: {

    const page = parseInt(searchParams.get('page') || '1');          start: "2024-01-22",

    const limit = parseInt(searchParams.get('limit') || '10');          end: "2024-01-28",

    const skip = (page - 1) * limit;          totalWorkers: 12,

          totalHours: 384.5,

    // Get restaurant          totalGrossPay: 8234.80,

    const restaurant = await prisma.restaurant.findUnique({          totalTips: 1456.30,

      where: { userId: session.user.id }          totalTaxes: 1235.22,

    });          totalNetPay: 6999.58,

          status: "PROCESSING"

    if (!restaurant) {        },

      return NextResponse.json(        upcomingPayments: [

        { error: 'Restaurant not found' },          {

        { status: 404 }            workerId: "worker_001",

      );            name: "Sarah Johnson",

    }            netPay: 461.06,

            payDate: "2024-02-02",

    // Get recent timesheets as payment history            method: "DIRECT_DEPOSIT"

    const recentTimesheets = await prisma.timesheet.findMany({          },

      where: {          {

        restaurantId: restaurant.id,            workerId: "worker_002", 

        totalPay: { gt: 0 }            name: "Mike Chen",

      },            netPay: 523.44,

      include: {            payDate: "2024-02-02",

        user: {            method: "DIRECT_DEPOSIT"

          select: {          },

            id: true,          {

            name: true,            workerId: "worker_003",

            email: true            name: "Carlos Rodriguez", 

          }            netPay: 398.72,

        }            payDate: "2024-02-02",

      },            method: "CHECK"

      orderBy: {          }

        createdAt: 'desc'        ],

      },        monthlyTotals: {

      skip,          january2024: {

      take: limit            totalPaid: 13567.89,

    });            totalWorkers: 15,

            avgPayPerWorker: 904.53

    const totalCount = await prisma.timesheet.count({          }

      where: {        }

        restaurantId: restaurant.id,      }

        totalPay: { gt: 0 }    })

      }  }

    });

  if (type === 'summary') {

    const payrollHistory = recentTimesheets.map(timesheet => ({    // Return payment system summary

      id: timesheet.id,    return NextResponse.json({

      workerId: timesheet.userId,      systemOverview: {

      workerName: timesheet.user.name,        totalActiveWorkers: 47,

      workerEmail: timesheet.user.email,        pendingTimesheets: 23,

      date: timesheet.date.toISOString(),        pendingApprovals: 8,

      hours: timesheet.hoursWorked,        upcomingPayments: 12,

      amount: timesheet.totalPay,        totalMonthlyPayroll: 45680.50,

      status: 'completed',        avgProcessingTime: 2.3, // days

      createdAt: timesheet.createdAt.toISOString()        complianceScore: 98.5,

    }));        directDepositRate: 0.89

      },

    return NextResponse.json({      recentActivity: [

      success: true,        {

      payments: payrollHistory,          type: "TIMESHEET_SUBMITTED",

      pagination: {          workerId: "worker_001",

        page,          workerName: "Sarah Johnson",

        limit,          timestamp: "2024-01-28T10:30:00Z",

        total: totalCount,          details: "Submitted timesheet for week ending 01/28"

        totalPages: Math.ceil(totalCount / limit)        },

      }        {

    });          type: "PAYMENT_PROCESSED",

          workerId: "worker_002",

  } catch (error) {          workerName: "Mike Chen", 

    console.error('Error fetching payroll history:', error);          timestamp: "2024-01-26T14:45:00Z",

    return NextResponse.json(          details: "Direct deposit payment processed - $523.44"

      { error: 'Internal server error' },        },

      { status: 500 }        {

    );          type: "TIMESHEET_APPROVED",

  }          workerId: "worker_003",

}          workerName: "Carlos Rodriguez",
          timestamp: "2024-01-26T09:15:00Z",
          details: "Timesheet approved by manager"
        }
      ],
      taxCompliance: {
        w2FormsGenerated: 47,
        "1099FormsGenerated": 0,
        quarterlyFilings: "UP_TO_DATE",
        nextFilingDue: "2024-04-15"
      }
    })
  }

  // Default expense tracking data
  return NextResponse.json({
    expenses: [
      {
        id: "exp_001",
        workerId: workerId,
        type: "TRAVEL",
        amount: 12.50,
        description: "Uber to restaurant location",
        date: "2024-01-22",
        status: "APPROVED",
        receiptUrl: "/receipts/uber_123.jpg"
      },
      {
        id: "exp_002",
        workerId: workerId,
        type: "UNIFORM",
        amount: 45.00,
        description: "Black shoes for work uniform",
        date: "2024-01-20",
        status: "PENDING",
        receiptUrl: "/receipts/shoes_456.jpg"
      }
    ]
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, workerId, data } = body

  switch (action) {
    case 'clockIn':
      return NextResponse.json({
        success: true,
        message: "Clocked in successfully",
        timeEntry: {
          id: `entry_${Date.now()}`,
          workerId,
          clockIn: new Date().toISOString(),
          location: data.location,
          shiftId: data.shiftId
        }
      })

    case 'clockOut':
      return NextResponse.json({
        success: true,
        message: "Clocked out successfully",
        timeEntry: {
          id: data.entryId,
          clockOut: new Date().toISOString(),
          totalHours: data.totalHours || 8.0,
          tips: data.tips || 0
        }
      })

    case 'submitTimesheet':
      return NextResponse.json({
        success: true,
        message: "Timesheet submitted for approval",
        timesheetId: `ts_${Date.now()}`,
        status: "PENDING_APPROVAL"
      })

    case 'approveTimesheet':
      return NextResponse.json({
        success: true,
        message: "Timesheet approved successfully",
        approvedAt: new Date().toISOString(),
        approvedBy: data.approverId
      })

    case 'processPayroll':
      return NextResponse.json({
        success: true,
        message: "Payroll processing initiated",
        batchId: `batch_${Date.now()}`,
        estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        workersAffected: data.workerIds?.length || 0
      })

    case 'submitExpense':
      const { type, amount, description, receiptFile } = data
      return NextResponse.json({
        success: true,
        message: "Expense submitted successfully",
        expense: {
          id: `exp_${Date.now()}`,
          workerId,
          type,
          amount,
          description,
          date: new Date().toISOString().split('T')[0],
          status: "PENDING",
          receiptUrl: receiptFile ? `/receipts/${receiptFile.name}` : null
        }
      })

    case 'generatePayStub':
      return NextResponse.json({
        success: true,
        message: "Pay stub generated",
        payStub: {
          id: `stub_${Date.now()}`,
          workerId,
          payPeriod: data.payPeriod,
          generatedAt: new Date().toISOString(),
          downloadUrl: `/api/paystubs/${workerId}/${data.payPeriod}`
        }
      })

    case 'updateTaxInfo':
      return NextResponse.json({
        success: true,
        message: "Tax information updated successfully",
        effectiveDate: new Date().toISOString()
      })

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { timesheetId, updates } = body

  return NextResponse.json({
    success: true,
    message: "Timesheet updated successfully",
    timesheet: {
      id: timesheetId,
      ...updates,
      updatedAt: new Date().toISOString()
    }
  })
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const timesheetId = searchParams.get('timesheetId')
  const expenseId = searchParams.get('expenseId')

  if (timesheetId) {
    return NextResponse.json({
      success: true,
      message: "Timesheet deleted successfully"
    })
  }

  if (expenseId) {
    return NextResponse.json({
      success: true,
      message: "Expense record deleted successfully"
    })
  }

  return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 })
}