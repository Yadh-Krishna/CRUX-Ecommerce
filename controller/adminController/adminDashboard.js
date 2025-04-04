const bcrypt=require('bcrypt');
const Admin=require('../../models/adminModal');
const jwt = require("jsonwebtoken");
const statusCodes=require('../../utils/statusCodes');
const errorMessages=require('../../utils/errorMessages');
const Wishlist=require('../../models/wishlistModel');
const Order=require('../../models/orderModal');
const Product=require('../../models/productModel')
const Cart=require('../../models/cartModel');
const Wallet=require('../../models/walletModel');
const Coupon=require('../../models/couponModel');
const moment=require('moment');
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const dashboardAnalytics=require('../../utils/dashboardAnalytics');

const loadLogin = (req, res) => {
    const token = req.cookies.adminToken; // Read token from cookies

    if (token) {
        try {
            const verified = jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect("/admin/dashboard"); // Redirect if admin is already logged in
        } catch (error) {
            res.clearCookie("adminToken"); // Clear invalid token
        }
    }

    res.render("admin-login", { error: null }); // Render login page if not authenticated
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });

        if (!admin || !(await bcrypt.compare(password, admin.password))) {
            return res.render("admin-login", { error: "Invalid email or password" });
        }

        // Generate JWT token
        const token = jwt.sign({ adminId: admin._id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // Store token in HTTP-only Cookie
        res.cookie("adminToken", token, {
            httpOnly: true,    // Prevents JavaScript access (security best practice)
            secure: process.env.NODE_ENV === "development", 
            sameSite: "strict", // Protect against CSRF
            maxAge: 1 * 60 * 60 * 1000 // Token expires in 1 hour
        });

        res.redirect("/admin/dashboard");
    } catch (error) {
        console.error("Login error:", error);
        res.render("admin-login", { error: "Server error. Please try again later." });
    }
};

const loadDashboard = (req, res) => {
    const token = req.cookies.adminToken; // Read token from cookies

    if (!token) {
        return res.redirect("/admin/login"); // Redirect if no token
    }

    try {
        // Verify and decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded; // Attach admin data for use in the template
        
        res.render("dashboard",); // Pass admin data to view
    } catch (error) {
        res.clearCookie("adminToken"); // Clear invalid token
        return res.redirect("/admin/login"); // Redirect to login
    }
};

const getDashboardData = async (req, res) => {
    try {
        const timeFilter = req.query.timeFilter || 'monthly';
        const dashboardData = await dashboardAnalytics.getDashboardData(timeFilter);
        return res.json(dashboardData);
    } catch (err) {
        console.error('Dashboard data error:', err);
        return res.status(500).json({ 
            error: 'Failed to load dashboard data',
            message: err.message 
        });
    }
}

const logout = (req, res) => {
    res.clearCookie("adminToken"); // Remove the token from cookies
    res.redirect("/admin/login"); // Redirect to login page
};

const loadSales=async(req,res)=>{
    try{
            let { period, dateFrom, dateTo, search, page = 1 } = req.query;
            const limit = 10; // Pagination limit
            page = parseInt(page);
    
            let query = { "items.status": "Delivered" };
            let startDate, endDate;
    
            if (period) {
                const today = moment().startOf("day");
    
                switch (period) {
                    case "daily":
                        startDate = today;
                        endDate = moment(today).endOf("day");
                        break;
                    case "weekly":
                        startDate = moment(today).startOf("isoWeek");
                        endDate = moment(today).endOf("isoWeek");
                        break;
                    case "monthly":
                        startDate = moment(today).startOf("month");
                        endDate = moment(today).endOf("month");
                        break;
                    case "yearly":
                        startDate = moment(today).startOf("year");
                        endDate = moment(today).endOf("year");
                        break;
                    case "custom":
                        if (dateFrom && dateTo) {
                            startDate = moment(dateFrom).startOf("day");
                            endDate = moment(dateTo).endOf("day"); 
                        }
                        break;
                    default:
                        break;
                }
    
                if (startDate && endDate) {
                    query["createdAt"] = { $gte: startDate.toDate(), $lte: endDate.toDate() };
                }
            }
    
            if (search) {
                query.$or = [
                    { "user.fullName": { $regex: search, $options: "i" } },
                    { "user.email": { $regex: search, $options: "i" } },
                    { "orderId": { $regex: search, $options: "i" } },
                ];
            }
    
            const totalOrders = await Order.countDocuments(query);
            const orders = await Order.find(query)
                .populate("user", "fullName email")
                .populate('items.product','name').populate('couponId')
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ createdAt: -1 });
    
            // Calculate Sales Summary
            let totalSales = 0, totalDiscounts = 0, deliveredItemCount = 0;
            let paymentMethods = {};
            let coupons = {};
    
            orders.forEach(order => {
                order.items.forEach(item => {
                    if (item.status === "Delivered") {
                        totalSales += item.finalPrice * item.quantity;
                        totalDiscounts += item.discount * item.quantity;
                        deliveredItemCount++;
    
                        // Count payment methods
                        paymentMethods[order.paymentMethod] = (paymentMethods[order.paymentMethod] || 0) + 1;
    
                        // Track coupon usage
                        // if (order.couponApplied) {
                        //     coupons[order.couponId.name] = (coupons[order.couponId.name] || 0) + order.coupon.discount;
                        // }
                    }
                });
            });
    
            res.render("sales-report", {
                deliveredOrders: orders,
                totalSales,
                totalDiscounts,
                deliveredItemCount,
                totalOrders,
                currentPage: page,
                totalPages: Math.ceil(totalOrders / limit),
                paymentMethods: Object.keys(paymentMethods).map(key => ({ name: key, count: paymentMethods[key] })),
               // coupons: Object.keys(coupons).map(key => ({ code: key, totalDiscount: coupons[key] })),
                filterParams: `&period=${period}&dateFrom=${dateFrom || ""}&dateTo=${dateTo || ""}&search=${search || ""}`
            });
    
        } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
        }    
}

async function getFilteredOrders(query) {
    let filter = { "items.status": "Delivered" };

    if (query.period && query.period !== "custom") {
        const today = new Date();
        let startDate, endDate;

        switch (query.period) {
            case "daily":
                startDate =  today.setHours(0, 0, 0, 0);
                endDate = today.setHours(23, 59, 59, 999);
                break;
            case "weekly":
                startDate = new Date(today.setDate(today.getDate() - today.getDay())).setHours(0, 0, 0, 0); // Start of the week
                endDate = new Date().setHours(23, 59, 59, 999);
                break;
            case "monthly":
                startDate = new Date(today.getFullYear(), today.getMonth(), 1).setHours(0, 0, 0, 0);
                endDate = new Date().setHours(23, 59, 59, 999);
                break;
            case "yearly":
                startDate = new Date(today.getFullYear(), 0, 1).setHours(0, 0, 0, 0);
                endDate = new Date().setHours(23, 59, 59, 999);
                break;
        }
        filter["createdAt"] = { $gte: startDate, $lte: endDate };
    } else if (query.dateFrom && query.dateTo) {
        filter["createdAt"] = { $gte: new Date(query.dateFrom), $lte: new Date(query.dateTo) };
    }

    if (query.search) {
        filter["user.fullName"] = { $regex: query.search, $options: "i" };
    }
    
    return await Order.find(filter)
        .populate("user", "fullName email")
        .populate("items.product")
        .lean();
}

const pdfExport = async (req, res) => {
    try {
        const orders = await getFilteredOrders(req.query);
        const reportsDir = path.join(__dirname, "../../public/reports");
        if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

        const fileName = `sales-report-${Date.now()}.pdf`;
        const filePath = path.join(reportsDir, fileName);

        const doc = new PDFDocument({ margin: 40, size: "A4" });
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // **Company Header**
        doc.fontSize(22).font("Helvetica-Bold").text("CRUX E-Commerce", { align: "center" });
        doc.fontSize(16).font("Helvetica").text("Sales Report", { align: "center" });
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Generated On: ${new Date().toLocaleString()}`, { align: "right" });
        doc.moveDown(1);

        // **Filters Applied**
        let filterInfo = "Filters Applied: ";
        if (req.query.period) filterInfo += `Period: ${req.query.period.toUpperCase()}, `;
        if (req.query.dateFrom && req.query.dateTo) filterInfo += `Date Range: ${req.query.dateFrom} - ${req.query.dateTo}, `;
        if (req.query.search) filterInfo += `Search: "${req.query.search}", `;
        filterInfo = filterInfo.replace(/,\s*$/, ""); // Remove trailing comma

        doc.fontSize(10).font("Helvetica-Oblique").fillColor("gray").text(filterInfo);
        doc.fillColor("black").moveDown(1);

        // **Sales Summary Calculation**
        let totalOrders = 0, totalDeliveredItems = 0, totalSales = 0;
        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.status === "Delivered") {
                    totalDeliveredItems++;
                    totalSales += item.finalPrice;
                }
            });
            totalOrders++;
        });

        // **Summary Box**
        doc.rect(40, doc.y, 520, 70).stroke();
        doc.fontSize(12).font("Helvetica-Bold");
        doc.text(`Total Orders: ${totalOrders}`, 50, doc.y + 10);
        doc.text(`Total Delivered Items: ${totalDeliveredItems}`, 250, doc.y + 10);
        doc.text(`Total Sales Amount: Rs.${totalSales.toFixed(2)}`, 450, doc.y + 10);
        doc.moveDown(3);

        // **Table Header**
        let yPos = doc.y + 10;
        doc.rect(40, yPos, 520, 20).fill("#f2f2f2").stroke();
        doc.fillColor("black").fontSize(10).text("Order ID", 50, yPos + 5);
        doc.text("Customer", 150, yPos + 5);
        doc.text("Email", 270, yPos + 5);
        doc.text("Total Amount", 430, yPos + 5);
        doc.moveDown(1);

        // **Table Data**
        doc.fontSize(9);
        orders.forEach(order => {
            let orderTotal = 0;
            let deliveredItems = [];

            order.items.forEach(item => {
                if (item.status === "Delivered") {
                    deliveredItems.push(`${item.product.name} (Rs. ${item.finalPrice})`);
                    orderTotal += item.finalPrice + (item.finalPrice * 0.1);
                }
            });

            if (deliveredItems.length > 0) {
                yPos = doc.y;
                doc.rect(40, yPos, 520, 40).stroke();
                doc.text(`#${order.orderId}`, 50, yPos + 10);
                doc.text(order.user.fullName, 150, yPos + 10);
                doc.text(order.user.email, 270, yPos + 10);
                doc.text(`Rs. ${orderTotal.toFixed(2)}`, 430, yPos + 10);

                doc.moveDown(2);
                doc.fontSize(9).text("Items:", 60);
                deliveredItems.forEach(item => {
                    doc.fontSize(9).text(`- ${item}`, 80);
                });
                doc.moveDown(1);
            }
        });

        doc.end();
        writeStream.on("finish", () => res.download(filePath));
    } catch (error) {
        console.error(error);
        res.status(500).send("Error generating PDF");
    }
};

const excelExport = async (req, res) => {
    try {
        const orders = await getFilteredOrders(req.query);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sales Report");

        // **Header Styling**
        const headerStyle = { bold: true, font: { size: 14 } };

        // **Filters Applied**
        let filterText = "Filters Applied: ";
        if (req.query.period) filterText += `Period: ${req.query.period.toUpperCase()}, `;
        if (req.query.dateFrom && req.query.dateTo) filterText += `Date Range: ${req.query.dateFrom} - ${req.query.dateTo}, `;
        if (req.query.search) filterText += `Search: "${req.query.search}", `;
        filterText = filterText.replace(/,\s*$/, ""); // Remove trailing comma

        worksheet.mergeCells("A1:H1");
        worksheet.getCell("A1").value = "CRUX E-Commerce - Sales Report";
        worksheet.getCell("A1").font = { bold: true, size: 16 };
        worksheet.getCell("A1").alignment = { horizontal: "center" };

        worksheet.mergeCells("A2:H2");
        worksheet.getCell("A2").value = `Generated On: ${new Date().toLocaleString()}`;
        worksheet.getCell("A2").alignment = { horizontal: "center" };

        worksheet.mergeCells("A3:H3");
        worksheet.getCell("A3").value = filterText;
        worksheet.getCell("A3").font = { italic: true, size: 12, color: { argb: "FF555555" } };

        worksheet.addRow([]);

        // **Sales Summary Calculation**
        let totalOrders = 0, totalDeliveredItems = 0, totalSales = 0;
        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.status === "Delivered") {
                    totalDeliveredItems++;
                    totalSales += item.finalPrice || 0;
                }
            });
            totalOrders++;
        });

        // **Sales Summary Box**
        const summaryData = [
            ["Total Orders", totalOrders],
            ["Total Delivered Items", totalDeliveredItems],
            ["Total Sales Amount", `₹${totalSales.toFixed(2)}`],
        ];

        summaryData.forEach(row => {
            let rowIndex = worksheet.addRow(row).number;
            worksheet.getCell(`A${rowIndex}`).font = headerStyle;
            worksheet.getCell(`B${rowIndex}`).font = { bold: true };
        });

        worksheet.addRow([]);

        // **Table Headers (Ensuring It Prints)**
        const headerRow = worksheet.addRow([
            "Sl No", "Order ID", "Customer", "Email", "Product", 
            "Final Price", "Payment Method", "Order Date"
        ]);

        // **Apply Header Styling**
        headerRow.eachCell(cell => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: "center" };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFCCCCCC" } }; // Light gray background
            cell.border = { bottom: { style: "thin" } };
        });

        // **Table Data**
        let counter = 1;
        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.status === "Delivered") {
                    worksheet.addRow([
                        counter++,
                        order.orderId || "N/A",
                        order.user?.fullName || "N/A",
                        order.user?.email || "N/A",
                        item.product?.name || "Unknown Product",
                        `₹${(item.finalPrice + (item.finalPrice * 0.1) || 0).toFixed(2)}`,
                        order.paymentMethod || "Not Specified",
                        new Date(order.createdAt).toLocaleDateString() || "N/A"
                    ]);
                }
            });
        });

        // **AutoFit Columns & Formatting**
        worksheet.eachRow(row => {
            row.alignment = { vertical: "middle", horizontal: "center" };
        });
      
        // **Download File**
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=sales-report.xlsx");

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Excel Export Error:", error);
        res.status(500).send("Error generating Excel");
    }
};


module.exports={
    loadLogin,
    login,
    loadDashboard,
    getDashboardData,
    logout,  
    loadSales,
    pdfExport,
    excelExport
}
