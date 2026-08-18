const User = require('../models/User');
const Plan = require('../models/Plan');
const Ticket = require('../models/Ticket');
const PlatformSettings = require('../models/PlatformSettings');
const InvoiceTemplate = require('../models/InvoiceTemplate');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Item = require('../models/Item');
const Party = require('../models/Party');
const Expense = require('../models/Expense');
const Journal = require('../models/Journal');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Get all users (SuperAdmin only)
// @route   GET /api/admin/users
// @access  Private
const getAllUsers = async (req, res) => {
  try {
    const allSales = await Invoice.find({ type: 'Sale' });
    const users = await User.find({}).sort({ createdAt: -1 });

    const usersWithBizInfo = users.map(u => {
      const userInvoices = allSales.filter(inv => inv.user && inv.user.toString() === u._id.toString());
      const rev = userInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      return {
        ...u.toObject(),
        revenue: rev,
        city: u.businessAddress || 'India',
        businessType: u.businessType || 'Retail Shop'
      };
    });

    res.status(200).json(usersWithBizInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user status (Ban/Unban)
// @route   PUT /api/admin/users/:id/status
// @access  Private
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Banned'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.status = status;
    await user.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Admin Dashboard Data (SuperAdmin only)
// @route   GET /api/admin/dashboard
// @access  Private
const getAdminDashboardData = async (req, res) => {
  try {
    const allUsers = await User.find({});
    const totalUsersCount = allUsers.filter(u => u.role === 'vendor').length;
    const activeUsersCount = allUsers.filter(u => u.role === 'vendor' && u.status !== 'Banned').length;
    
    const totalBusinessesCount = totalUsersCount;

    const allSales = await Invoice.find({ type: 'Sale' });
    const totalSalesAmount = allSales.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    
    const allPayments = await Payment.find({ type: 'Payment In' });
    const subscriptionPayments = allPayments.filter(p => !p.party && p.description && /subscription|plan|upgrade/i.test(p.description));
    const totalPaymentsAmount = subscriptionPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const monthlyRevenue = totalPaymentsAmount;

    const planCounts = { Free: 0, Silver: 0, Gold: 0, Enterprise: 0 };
    allUsers.forEach((u) => {
      if (u.role !== 'vendor') return;
      const planName = u.subscription?.plan || 'Free';
      const normalizedPlan = planName.charAt(0).toUpperCase() + planName.slice(1).toLowerCase();
      if (planCounts[normalizedPlan] !== undefined) {
        planCounts[normalizedPlan]++;
      } else {
        planCounts['Free']++;
      }
    });

    const subscriptionDistribution = [
      { name: "Free", value: planCounts.Free, fill: "#94a3b8" },
      { name: "Silver", value: planCounts.Silver, fill: "#3b82f6" },
      { name: "Gold", value: planCounts.Gold, fill: "#f59e0b" },
      { name: "Enterprise", value: planCounts.Enterprise, fill: "#8b5cf6" },
    ];

    const activeSubscriptions = allUsers.filter(u => u.role === 'vendor' && u.subscription?.status === 'active' && u.subscription?.plan !== 'Free').length;

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthIndex = new Date().getMonth();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIndex - i + 12) % 12;
      last6Months.push({ month: months[idx], revenue: 0, expenses: 0 });
    }

    const allExpenses = await Expense.find({});

    subscriptionPayments.forEach(p => {
      const pMonth = months[new Date(p.date || p.createdAt).getMonth()];
      const chartItem = last6Months.find(item => item.month === pMonth);
      if (chartItem) {
        chartItem.revenue += (p.amount || 0);
      }
    });

    allExpenses.forEach(e => {
      const eMonth = months[new Date(e.date || e.createdAt).getMonth()];
      const chartItem = last6Months.find(item => item.month === eMonth);
      if (chartItem) {
        chartItem.expenses += (e.amount || 0);
      }
    });

    const businessGrowthData = last6Months.map(item => ({
      month: item.month,
      businesses: totalBusinessesCount,
      users: totalUsersCount
    }));

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dailySignups = days.map(day => ({ day, signups: 0 }));
    allUsers.forEach(u => {
      if (u.role !== 'vendor') return;
      const uDay = days[new Date(u.createdAt).getDay()];
      const signupItem = dailySignups.find(item => item.day === uDay);
      if (signupItem) signupItem.signups++;
    });

    const businesses = await Promise.all(
      allUsers
        .filter(u => u.role === 'vendor')
        .map(async (u, idx) => {
          const userInvoices = allSales.filter(inv => inv.user && inv.user.toString() === u._id.toString());
          const rev = userInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
          return {
            id: u._id,
            name: u.businessName || u.name || `Business ${idx+1}`,
            owner: u.name,
            phone: u.phone,
            email: u.email || '',
            plan: u.subscription?.plan || 'Free',
            status: u.status || 'Active',
            revenue: rev,
            users: 1,
            city: u.businessAddress || 'India',
            type: u.businessType || 'Retail Shop'
          };
        })
    );

    const transactions = subscriptionPayments.slice(0, 6).map((p, idx) => {
      const associatedUser = p.user ? allUsers.find(u => u._id.toString() === p.user.toString()) : null;
      return {
        id: p.referenceNumber || `TXN-${new Date(p.date).getFullYear()}-${String(idx + 1).padStart(3, '0')}`,
        business: associatedUser?.businessName || "Walk-in Party",
        amount: p.amount,
        status: "Success",
        method: p.paymentMode || "UPI",
        date: new Date(p.date).toLocaleDateString(),
        plan: associatedUser?.subscription?.plan || "Free"
      };
    });

    const recentActivities = [];
    allUsers
      .filter(u => u.role === 'vendor')
      .slice(0, 6)
      .forEach(u => {
        recentActivities.push({
          action: "New Business Registered",
          detail: `${u.businessName || 'N/A'} — ${u.businessAddress || 'N/A'}`,
          time: new Date(u.createdAt).toLocaleDateString(),
          type: "business"
        });
      });

    const failedPaymentsCount = await Payment.countDocuments({ status: 'Failed' });
    const supportTicketsCount = await Ticket.countDocuments({});
    const pendingApprovalsCount = await User.countDocuments({ role: 'vendor', status: 'Pending' });

    res.status(200).json({
      platformKPIs: {
        totalBusinesses: totalBusinessesCount,
        activeSubscriptions,
        monthlyRevenue,
        platformGrowth: totalBusinessesCount ? 10 : 0,
        activeUsers: activeUsersCount,
        pendingApprovals: pendingApprovalsCount,
        failedPayments: failedPaymentsCount,
        supportTickets: supportTicketsCount,
      },
      revenueChartData: last6Months,
      businessGrowthData,
      subscriptionDistribution,
      dailySignups,
      businesses,
      transactions,
      recentActivities
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Admin Analytics Data (SuperAdmin only)
// @route   GET /api/admin/analytics
// @access  Private
const getAdminAnalyticsData = async (req, res) => {
  try {
    const allUsers = await User.find({});
    const totalUsersCount = allUsers.filter(u => ['vendor', 'admin', 'staff', 'user'].includes(u.role)).length;
    const activeUsersCount = allUsers.filter(u => ['vendor', 'admin', 'staff', 'user'].includes(u.role) && u.status !== 'Banned').length;

    const vendors = allUsers.filter(u => ['vendor', 'admin', 'staff', 'user'].includes(u.role));
    const totalVendors = vendors.length || 1;

    const billingVendorsCount = await Invoice.distinct('user');
    const expenseVendorsCount = await Expense.distinct('user');
    const partyVendorsCount = await Party.distinct('user');
    const itemVendorsCount = await Item.distinct('user');
    const journalVendorsCount = await Journal.distinct('user');

    const featureUsage = [
      { feature: "Billing", usage: Math.round((billingVendorsCount.length / totalVendors) * 100) || 0 },
      { feature: "Parties", usage: Math.round((partyVendorsCount.length / totalVendors) * 100) || 0 },
      { feature: "Inventory", usage: Math.round((itemVendorsCount.length / totalVendors) * 100) || 0 },
      { feature: "Expenses", usage: Math.round((expenseVendorsCount.length / totalVendors) * 100) || 0 },
      { feature: "Accounting", usage: Math.round((journalVendorsCount.length / totalVendors) * 100) || 0 },
      { feature: "Reports", usage: Math.round((billingVendorsCount.length / totalVendors) * 100) || 0 }
    ];

    const allInvoices = await Invoice.find({ type: 'Sale' });
    
    const geoMap = {};
    for (const u of vendors) {
      const city = u.businessAddress?.trim() || "Others";
      if (!geoMap[city]) {
        geoMap[city] = { city, biz: 0, rev: 0 };
      }
      geoMap[city].biz++;
      const userInvoices = allInvoices.filter(inv => inv.user && inv.user.toString() === u._id.toString());
      geoMap[city].rev += userInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    }

    const geoData = Object.values(geoMap)
      .sort((a, b) => b.biz - a.biz)
      .slice(0, 6);

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 60 * 60 * 24 * 1000);

    const mauCount = allUsers.filter(u => ['vendor', 'admin', 'staff', 'user'].includes(u.role) && u.updatedAt >= thirtyDaysAgo).length;
    const dauCount = allUsers.filter(u => ['vendor', 'admin', 'staff', 'user'].includes(u.role) && u.updatedAt >= oneDayAgo).length;

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const userEngagement = days.map((day) => {
      const activeOnDay = allUsers.filter(u => {
        if (!['vendor', 'admin', 'staff', 'user'].includes(u.role)) return false;
        const dObj = new Date(u.updatedAt || u.createdAt || Date.now());
        const uDay = isNaN(dObj.getTime()) ? days[0] : days[dObj.getDay()];
        return uDay === day;
      }).length;
      return {
        day,
        dau: activeOnDay || dauCount || 1,
        mau: mauCount || totalUsersCount || 1
      };
    });

    const paidCount = allUsers.filter(u => ['vendor', 'admin', 'staff', 'user'].includes(u.role) && u.subscription && u.subscription.plan !== 'Free').length;
    const trialCount = allUsers.filter(u => ['vendor', 'admin', 'staff', 'user'].includes(u.role) && (!u.subscription || u.subscription.plan === 'Free')).length;

    const conversionFunnel = [
      { stage: "Visitors", value: totalUsersCount * 2 || 10, fill: "#3b82f6" },
      { stage: "Signups", value: totalUsersCount, fill: "#8b5cf6" },
      { stage: "Trial", value: trialCount, fill: "#f59e0b" },
      { stage: "Paid", value: paidCount, fill: "#10b981" },
    ];

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const allPaymentsIn = await Payment.find({ type: 'Payment In' });
    const currentMonthIdx = new Date().getMonth();

    const forecastData = [];
    for (let i = 5; i >= 0; i--) {
      const mIdx = (currentMonthIdx - i + 12) % 12;
      const mName = months[mIdx];
      const mRev = allPaymentsIn
        .filter(p => {
          const pD = new Date(p.date || p.createdAt || Date.now());
          return !isNaN(pD.getTime()) && pD.getMonth() === mIdx;
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      forecastData.push({ m: mName, actual: mRev });
    }

    const avgRev = forecastData.reduce((sum, d) => sum + d.actual, 0) / (forecastData.length || 1);
    for (let i = 1; i <= 3; i++) {
      const fIdx = (currentMonthIdx + i) % 12;
      const fName = months[fIdx];
      const fRev = Math.round(avgRev * (1 + 0.05 * i));
      forecastData.push({ m: fName, forecast: fRev });
    }

    const sessionDuration = `${8 + (totalUsersCount % 5)}m ${15 + (totalUsersCount % 40)}s`;
    const conversionRate = totalUsersCount ? `${((paidCount / totalUsersCount) * 100).toFixed(1)}%` : "0.0%";
    
    const bannedCount = allUsers.filter(u => ['vendor', 'admin', 'staff', 'user'].includes(u.role) && u.status === 'Banned').length;
    const churnRate = totalUsersCount ? `${((bannedCount / totalUsersCount) * 100).toFixed(1)}%` : "0.0%";

    res.status(200).json({
      geoData,
      featureUsage,
      userEngagement,
      conversionFunnel,
      forecastData,
      kpis: {
        dau: dauCount,
        sessionDuration,
        conversionRate,
        churnRate
      }
    });
  } catch (error) {
    console.error("GET_ADMIN_ANALYTICS_ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Admin Businesses List (SuperAdmin only)
// @route   GET /api/admin/businesses
// @access  Private
const getAdminBusinesses = async (req, res) => {
  try {
    const allSales = await Invoice.find({ type: 'Sale' });
    const allUsers = await User.find({ role: 'vendor' });

    const businesses = allUsers.map((u, idx) => {
      const userInvoices = allSales.filter(inv => inv.user.toString() === u._id.toString());
      const rev = userInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      return {
        id: u._id,
        name: u.businessName || u.name || `Business ${idx+1}`,
        owner: u.name,
        phone: u.phone,
        email: u.email || '',
        plan: u.subscription?.plan || 'Free',
        status: u.status || 'Active',
        revenue: rev,
        users: 1,
        city: u.businessAddress || 'India',
        type: u.businessType || 'Retail Shop',
        lastActive: u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : 'N/A'
      };
    });

    res.status(200).json(businesses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve pending vendor registration (SuperAdmin only)
// @route   PUT /api/admin/vendors/:id/approve
// @access  Private
const approveVendor = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    user.status = 'Active';
    await user.save();
    res.status(200).json({ message: 'Vendor approved successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject pending vendor registration (SuperAdmin only)
// @route   PUT /api/admin/vendors/:id/reject
// @access  Private
const rejectVendor = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    user.status = 'Rejected';
    await user.save();
    res.status(200).json({ message: 'Vendor rejected successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Admin Subscriptions (SuperAdmin only)
// @route   GET /api/admin/subscriptions
// @access  Private
const getAdminSubscriptions = async (req, res) => {
  try {
    let dbPlans = await Plan.find({ status: 'Active' });
    if (dbPlans.length === 0) {
      const defaultPlans = [
        { name: "Free", price: 0, interval: "forever", features: ["50 invoices/month", "Basic inventory", "1 user", "Udaan branding"], popular: false, description: "Perfect for exploring the platform", platforms: "Mobile Only", allowedTemplates: ["GST Boxed", "Classic White"], showUdaanLogo: true },
        { name: "Silver", price: 199, interval: "month", features: ["Unlimited invoices", "Advanced inventory", "3 users", "No branding", "Basic GST"], popular: false, description: "Ideal for growing small businesses", platforms: "Mobile + Desktop", allowedTemplates: ["GST Boxed", "Classic White", "Modern Green"], showUdaanLogo: false },
        { name: "Gold", price: 299, interval: "month", features: ["Everything in Silver", "Unlimited users", "E-way bills", "Advanced GST", "Staff management"], popular: true, description: "Complete solution for mature businesses", platforms: "Mobile + Desktop", allowedTemplates: ["GST Boxed", "Classic White", "Modern Green", "Stylish Blue", "Minimalist", "Crimson Rose"], showUdaanLogo: false },
        { name: "Enterprise", price: 499, interval: "month", features: ["Everything in Gold", "Custom themes", "Priority support", "Barcode gen", "API access"], popular: false, description: "Premium subscription for enterprise needs", platforms: "Mobile + Desktop", allowedTemplates: ["GST Boxed", "Classic White", "Modern Green", "Stylish Blue", "Minimalist", "Crimson Rose", "Warm Amber", "Royal Purple", "Charcoal Dark", "Tally Classic"], showUdaanLogo: false }
      ];
      await Plan.insertMany(defaultPlans);
      dbPlans = await Plan.find({ status: 'Active' });
    }

    const allUsers = await User.find({ role: 'vendor' });

    const plans = dbPlans.map(plan => {
      const activeSubscribers = allUsers.filter(u => {
        const userPlan = u.subscription?.plan || 'Free';
        return userPlan.toLowerCase() === plan.name.toLowerCase();
      }).length;

      return {
        id: plan._id,
        name: plan.name,
        price: plan.price,
        interval: plan.interval,
        features: plan.features,
        popular: plan.popular,
        status: plan.status,
        description: plan.description || '',
        platforms: plan.platforms || 'Mobile + Desktop',
        allowedTemplates: plan.allowedTemplates || [],
        allowedModules: plan.allowedModules || (plan.name === 'Free' ? ['dashboard', 'billing', 'parties', 'expenses', 'admin', 'support', 'settings'] : ['dashboard', 'billing', 'inventory', 'parties', 'expenses', 'accounting', 'gst', 'reports', 'admin', 'support', 'settings']),
        showUdaanLogo: plan.showUdaanLogo !== undefined ? plan.showUdaanLogo : true,
        activeSubscribers,
        monthlyRevenue: activeSubscribers * plan.price
      };
    });

    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new subscription plan (SuperAdmin only)
// @route   POST /api/admin/subscriptions
// @access  Private
const createSubscriptionPlan = async (req, res) => {
  try {
    const { name, price, interval, features, popular, description, platforms, allowedTemplates, allowedModules, showUdaanLogo } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Name and price are required' });
    }
    const existingPlan = await Plan.findOne({ name, status: 'Active' });
    if (existingPlan) {
      return res.status(400).json({ message: 'Plan with this name already exists' });
    }
    const newPlan = await Plan.create({
      name,
      price,
      interval: interval || 'month',
      features: features || [],
      popular: !!popular,
      description,
      platforms: platforms || 'Mobile + Desktop',
      allowedTemplates: allowedTemplates || [],
      allowedModules: allowedModules || ['dashboard', 'billing', 'parties', 'admin', 'support', 'settings', 'inventory', 'expenses', 'reports', 'accounting', 'gst'],
      showUdaanLogo: showUdaanLogo !== undefined ? !!showUdaanLogo : true
    });
    res.status(201).json(newPlan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update subscription plan (SuperAdmin only)
// @route   PUT /api/admin/subscriptions/:id
// @access  Private
const updateSubscriptionPlan = async (req, res) => {
  try {
    const { name, price, interval, features, popular, description, platforms, allowedTemplates, allowedModules, showUdaanLogo } = req.body;
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    if (name) plan.name = name;
    if (price !== undefined) plan.price = price;
    if (interval) plan.interval = interval;
    if (features) plan.features = features;
    if (popular !== undefined) plan.popular = popular;
    if (description !== undefined) plan.description = description;
    if (platforms) plan.platforms = platforms;
    if (allowedTemplates) plan.allowedTemplates = allowedTemplates;
    if (allowedModules) plan.allowedModules = allowedModules;
    if (showUdaanLogo !== undefined) plan.showUdaanLogo = !!showUdaanLogo;

    await plan.save();
    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete/Archive subscription plan (SuperAdmin only)
// @route   DELETE /api/admin/subscriptions/:id
// @access  Private
const deleteSubscriptionPlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    // Instead of hard deleting, we archive it to prevent breaking user subscriptions
    plan.status = 'Archived';
    await plan.save();
    res.status(200).json({ message: 'Plan archived successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Impersonate user (SuperAdmin only)
// @route   POST /api/admin/impersonate/:id
// @access  Private
const impersonateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const token = generateToken(user._id);
    
    res.status(200).json({
      _id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      businessName: user.businessName,
      role: user.role,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Admin Revenue Analytics (SuperAdmin only)
// @route   GET /api/admin/revenue
// @access  Private
const getAdminRevenueData = async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const User = require('../models/User');

    const allPayments = await Payment.find({}).sort({ date: -1 });
    const allUsers = await User.find({});

    const subscriptionPayments = allPayments.filter(p => 
      p.type === 'Payment In' && 
      p.status !== 'Failed' &&
      !p.party && 
      p.description && /subscription|plan|upgrade/i.test(p.description)
    );

    const totalRevenue = subscriptionPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalTransactions = subscriptionPayments.length;
    
    // Grouping by plans for chart
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthIndex = new Date().getMonth();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIndex - i + 12) % 12;
      last6Months.push({ month: months[idx], silver: 0, gold: 0, enterprise: 0 });
    }

    subscriptionPayments.forEach(p => {
      if (p.status === 'Failed') return;
      const pMonth = months[new Date(p.date).getMonth()];
      const chartItem = last6Months.find(item => item.month === pMonth);
      if (chartItem) {
        // Find owner plan
        const associatedUser = p.user ? allUsers.find(u => u._id.toString() === p.user.toString()) : null;
        if (associatedUser) {
          const plan = associatedUser.subscription?.plan || 'Free';
          const normalizedPlan = plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
          if (normalizedPlan === 'Silver') chartItem.silver += p.amount;
          if (normalizedPlan === 'Gold') chartItem.gold += p.amount;
          if (normalizedPlan === 'Enterprise') chartItem.enterprise += p.amount;
        }
      }
    });

    const successfulCount = subscriptionPayments.filter(p => p.status !== 'Failed').length;
    const successRate = totalTransactions ? Number(((successfulCount / totalTransactions) * 100).toFixed(1)) : 100;

    // Recent Transactions list
    const transactionsList = subscriptionPayments.map((p, idx) => {
      const user = p.user ? allUsers.find(u => u._id.toString() === p.user.toString()) : null;
      return {
        id: p.referenceNumber || `TXN-${new Date(p.date).getFullYear()}-${String(idx + 1).padStart(3, '0')}`,
        business: user?.businessName || user?.name || "Walk-in Party",
        plan: user?.subscription?.plan || "Free",
        amount: p.amount,
        method: p.paymentMode || "UPI",
        status: p.status || "Success",
        date: new Date(p.date).toLocaleDateString()
      };
    });

    res.status(200).json({
      totalRevenue: totalRevenue,
      successRate: successRate,
      totalTransactions: totalTransactions,
      revenueBreakdown: last6Months,
      transactions: transactionsList
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get all support tickets (SuperAdmin only)
// @route   GET /api/admin/tickets
// @access  Private
const getAdminTickets = async (req, res) => {
  try {
    let dbTickets = await Ticket.find({}).populate('user').sort({ createdAt: -1 });
    
    // Seed some mock tickets if database is empty
    if (dbTickets.length === 0) {
      const allUsers = await User.find({ role: 'vendor' });
      if (allUsers.length > 0) {
        const mockTickets = [
          { id: "TKT-892", user: allUsers[0]._id, subject: "Invoice generation failing for bulk orders", description: "Getting 500 server error when trying to generate invoice with 100+ items.", priority: "High", status: "Open", assignee: "Support Team", messages: 4 },
          { id: "TKT-891", user: allUsers[0]._id, subject: "GST report not matching with actual data", description: "The GSTR-1 sheet has mismatch in total taxable value.", priority: "Critical", status: "Open", assignee: "Tax Team", messages: 7 },
          { id: "TKT-890", user: allUsers[0]._id, subject: "Cannot add new staff members", description: "Save button is disabled when adding staff details.", priority: "Medium", status: "In Progress", assignee: "Dev Team", messages: 3 }
        ];
        await Ticket.insertMany(mockTickets);
        dbTickets = await Ticket.find({}).populate('user').sort({ createdAt: -1 });
      }
    }

    const ticketsList = dbTickets.map(t => ({
      id: t.id,
      subject: t.subject,
      description: t.description,
      business: t.user?.businessName || t.user?.name || "Walk-in Party",
      priority: t.priority,
      status: t.status,
      created: new Date(t.createdAt).toLocaleDateString(),
      assignee: t.assignee,
      messages: t.messages
    }));

    res.status(200).json(ticketsList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update support ticket status / assignee (SuperAdmin only)
// @route   PUT /api/admin/tickets/:id
// @access  Private
const updateAdminTicketStatus = async (req, res) => {
  try {
    const { status, assignee } = req.body;
    const ticket = await Ticket.findOne({ id: req.params.id });
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    if (status) ticket.status = status;
    if (assignee) ticket.assignee = assignee;

    await ticket.save();
    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Admin Activity Log data (SuperAdmin only)
// @route   GET /api/admin/activity
// @access  Private
const getAdminActivityData = async (req, res) => {
  try {
    const User = require('../models/User');
    const Ticket = require('../models/Ticket');
    const Payment = require('../models/Payment');

    const allUsers = await User.find({}).sort({ createdAt: -1 });
    const allTickets = await Ticket.find({}).populate('user').sort({ createdAt: -1 });
    const allPayments = await Payment.find({}).populate('user').sort({ date: -1 });

    const activities = [];

    // Map business registration activities
    allUsers.filter(u => u.role === 'vendor').forEach((u, idx) => {
      activities.push({
        action: "New Business Registered",
        detail: `${u.businessName || 'Business'} — ${u.name} (${u.businessAddress || 'India'})`,
        time: idx === 0 ? "5 min ago" : idx === 1 ? "15 min ago" : `${idx} days ago`,
        type: "business"
      });
    });

    // Map tickets activities
    allTickets.forEach((t, idx) => {
      activities.push({
        action: t.status === 'Resolved' ? "Support Ticket Resolved" : "Support Ticket Opened",
        detail: `${t.id} — ${t.subject}`,
        time: idx === 0 ? "2 hrs ago" : `${idx + 1} days ago`,
        type: "support"
      });
    });

    // Map payments activities
    allPayments.forEach((p, idx) => {
      activities.push({
        action: p.type === 'Payment In' ? "Subscription Renewed" : "Payment Failed",
        detail: `${p.user?.businessName || 'User'} — ₹${p.amount} (${p.paymentMode || 'UPI'})`,
        time: idx === 0 ? "1 hr ago" : `${idx + 2} days ago`,
        type: p.type === 'Payment In' ? "subscription" : "payment"
      });
    });

    // Fallbacks if empty
    if (activities.length === 0) {
      activities.push(
        { action: "New Business Registered", detail: "Fresh Farm Dairy — Anita Desai (Ahmedabad)", time: "2 min ago", type: "business" },
        { action: "Subscription Upgraded", detail: "Sharma Traders: Silver → Gold plan", time: "15 min ago", type: "subscription" },
        { action: "Payment Failed", detail: "Quick Bites Cafe — ₹2,388 (UPI timeout)", time: "1 hr ago", type: "payment" },
        { action: "Business Suspended", detail: "Gupta & Sons — Policy violation detected", time: "3 hrs ago", type: "security" },
        { action: "Support Ticket Opened", detail: "#TKT-892 — Invoice generation issue", time: "5 hrs ago", type: "support" }
      );
    }

    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get platform settings (SuperAdmin only)
// @route   GET /api/admin/settings
// @access  Private
const getPlatformSettingsData = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne({});
    if (!settings) {
      settings = await PlatformSettings.create({});
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update platform settings (SuperAdmin only)
// @route   PUT /api/admin/settings
// @access  Private
const updatePlatformSettingsData = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne({});
    if (!settings) {
      settings = new PlatformSettings({});
    }
    
    // Explicitly update only allowed fields to prevent any issues with read-only/unexpected fields
    const allowedFields = [
      'platformName', 'platformUrl', 'supportEmail', 'maintenance',
      'smtpHost', 'smtpPort', 'senderEmail', 'emailEnabled',
      'gateway', 'gatewayKey', 'webhook', 'testMode', 'businessTypes'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();
    res.status(200).json(settings);
  } catch (error) {
    console.error('Error updating platform settings:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get currently logged in admin's profile (SuperAdmin only)
// @route   GET /api/admin/profile
// @access  Private
const getAdminProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update currently logged in admin's profile (SuperAdmin only)
// @route   PUT /api/admin/profile
// @access  Private
const updateAdminProfile = async (req, res) => {
  try {
    const { name, email, phone, businessName, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If phone is being changed, check if it's already taken
    if (phone && phone !== user.phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({ message: 'Phone number already registered by another user' });
      }
      user.phone = phone;
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (businessName !== undefined) user.businessName = businessName;

    // Handle password change if requested
    if (newPassword) {
      if (user.password) {
        if (!currentPassword) {
          return res.status(400).json({ message: 'Please provide current password to update password' });
        }
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch && user.password !== currentPassword) {
          return res.status(400).json({ message: 'Incorrect current password' });
        }
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    
    // Return updated details without password
    const updatedUser = {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      businessName: user.businessName,
      role: user.role
    };
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update billing settings (limit & ads) for a vendor
// @route   PUT /api/admin/users/:id/billing-settings
// @access  Private
const updateBillingSettings = async (req, res) => {
  try {
    const { billLimit, showAds } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (billLimit !== undefined) user.billLimit = Number(billLimit);
    if (showAds !== undefined) user.showAds = Boolean(showAds);

    await user.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user (SuperAdmin only)
// @route   DELETE /api/admin/users/:id
// @access  Private
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }
    await user.deleteOne();
    res.status(200).json({ message: 'User deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =============================================
// INVOICE TEMPLATE CRUD (Admin-managed)
// =============================================

// @desc    Get all invoice templates
// @route   GET /api/admin/invoice-templates
// @access  Private (Admin)
const getInvoiceTemplates = async (req, res) => {
  try {
    let templates = await InvoiceTemplate.find({}).sort({ sortOrder: 1 });
    if (templates.length === 0) {
      const defaultTemplates = [
        { name: "GST Boxed", description: "Standard boxed layout for GST invoices", componentKey: "gst-boxed", planTier: "Free", previewColor: "bg-slate-800", previewStyle: "header-bar", sortOrder: 1 },
        { name: "Classic White", description: "Clean and professional white layout", componentKey: "classic-white", planTier: "Free", previewColor: "bg-gray-100", previewStyle: "header-bar", sortOrder: 2 },
        { name: "Modern Green", description: "Modern look with green accents", componentKey: "modern-green", planTier: "Silver", previewColor: "bg-green-600", previewStyle: "header-bar", sortOrder: 3 },
        { name: "Stylish Blue", description: "Stylish blue themed invoice", componentKey: "stylish-blue", planTier: "Gold", previewColor: "bg-blue-600", previewStyle: "header-bar", sortOrder: 4 },
        { name: "Minimalist", description: "Minimalist layout without borders", componentKey: "minimalist", planTier: "Gold", previewColor: "bg-white", previewStyle: "header-bar", sortOrder: 5 },
        { name: "Crimson Rose", description: "Elegant crimson colored theme", componentKey: "crimson-rose", planTier: "Gold", previewColor: "bg-rose-600", previewStyle: "header-bar", sortOrder: 6 },
        { name: "Warm Amber", description: "Warm amber accents", componentKey: "warm-amber", planTier: "Enterprise", previewColor: "bg-amber-600", previewStyle: "header-bar", sortOrder: 7 },
        { name: "Royal Purple", description: "Premium purple theme", componentKey: "royal-purple", planTier: "Enterprise", previewColor: "bg-purple-600", previewStyle: "header-bar", sortOrder: 8 },
        { name: "Charcoal Dark", description: "Dark mode charcoal theme", componentKey: "charcoal-dark", planTier: "Enterprise", previewColor: "bg-gray-800", previewStyle: "header-bar", sortOrder: 9 },
        { name: "Tally Classic", description: "Classic Tally-style invoice", componentKey: "tally-classic", planTier: "Enterprise", previewColor: "bg-yellow-100", previewStyle: "header-bar", sortOrder: 10 }
      ];
      await InvoiceTemplate.insertMany(defaultTemplates);
      templates = await InvoiceTemplate.find({}).sort({ sortOrder: 1 });
    }
    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new invoice template
// @route   POST /api/admin/invoice-templates
// @access  Private (Admin)
const createInvoiceTemplate = async (req, res) => {
  try {
    const { name, description, componentKey, planTier, previewColor, previewStyle, isActive, sortOrder, isCustom, customHtml } = req.body;

    if (!name || !componentKey) {
      return res.status(400).json({ message: 'Name and componentKey are required' });
    }

    const existing = await InvoiceTemplate.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: `Template "${name}" already exists` });
    }

    const template = await InvoiceTemplate.create({
      name,
      description: description || '',
      componentKey,
      planTier: planTier || 'Free',
      previewColor: previewColor || 'bg-slate-800',
      previewStyle: previewStyle || 'header-bar',
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0,
      isCustom: isCustom || false,
      customHtml: customHtml || ''
    });

    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an invoice template
// @route   PUT /api/admin/invoice-templates/:id
// @access  Private (Admin)
const updateInvoiceTemplate = async (req, res) => {
  try {
    const template = await InvoiceTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const { name, description, componentKey, planTier, previewColor, previewStyle, isActive, sortOrder, isCustom, customHtml } = req.body;

    if (name !== undefined) template.name = name;
    if (description !== undefined) template.description = description;
    if (componentKey !== undefined) template.componentKey = componentKey;
    if (planTier !== undefined) template.planTier = planTier;
    if (previewColor !== undefined) template.previewColor = previewColor;
    if (previewStyle !== undefined) template.previewStyle = previewStyle;
    if (isActive !== undefined) template.isActive = isActive;
    if (sortOrder !== undefined) template.sortOrder = sortOrder;
    if (isCustom !== undefined) template.isCustom = isCustom;
    if (customHtml !== undefined) template.customHtml = customHtml;

    const updated = await template.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an invoice template
// @route   DELETE /api/admin/invoice-templates/:id
// @access  Private (Admin)
const deleteInvoiceTemplate = async (req, res) => {
  try {
    const template = await InvoiceTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    await template.deleteOne();
    res.status(200).json({ message: 'Template deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAdminDashboardData,
  getAdminAnalyticsData,
  getAdminBusinesses,
  approveVendor,
  rejectVendor,
  getAdminSubscriptions,
  impersonateUser,
  getAdminRevenueData,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getAdminTickets,
  updateAdminTicketStatus,
  getAdminActivityData,
  getPlatformSettingsData,
  updatePlatformSettingsData,
  getAdminProfile,
  updateAdminProfile,
  updateBillingSettings,
  getInvoiceTemplates,
  createInvoiceTemplate,
  updateInvoiceTemplate,
  deleteInvoiceTemplate
};
