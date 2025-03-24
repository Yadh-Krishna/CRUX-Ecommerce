const PDFDocument = require('pdfkit');
const fs = require('fs');

const generateInvoice = (order, filePath) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Pipe the PDF to a file
    doc.pipe(fs.createWriteStream(filePath));

    // Header Section
    doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('INVOICE', { align: 'center' })
        .moveDown();

    // Order & Customer Details
    doc
        .fontSize(12)
        .font('Helvetica')
        .text(`Order ID: ${order.orderId}`)
        .text(`Order Date: ${order.createdAt.toDateString()}`)
        .moveDown();

    doc
        .font('Helvetica-Bold')
        .text('Bill To:', { underline: true })
        .font('Helvetica')
        .text(order.user.fullName)
        .text(order.user.email)
        .moveDown();

    // Address Section
    doc
        .font('Helvetica-Bold')
        .text('Billing Address:', { underline: true })
        .font('Helvetica')
        .text(`${order.address.hName}, ${order.address.street}`)
        .text(`${order.address.city}, ${order.address.country}`)
        .text(`PIN: ${order.address.pin}`)
        .moveDown();

    // Order Items Table
    doc
        .font('Helvetica-Bold')
        .text('Order Items:', { underline: true })
        .moveDown();

    const startX = 50;
    const pageWidth = doc.page.width - 100; // Full width excluding margins
    const colWidths = [50, 250, 80, 80, 80]; // Adjusted for better spacing
    let currentY = doc.y;

    // Table Header
    doc.rect(startX, currentY, pageWidth, 25).fillAndStroke("#000", "#000");
    doc.fillColor("#fff")
        .text('Sl No.', startX + 5, currentY + 7)
        .text('Product', startX + colWidths[0] + 5, currentY + 7)
        .text('Qty', startX + colWidths[0] + colWidths[1] + 5, currentY + 7)
        .text('Price', startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 7)
        .text('Total', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, currentY + 7);

    currentY += 25;
    doc.fillColor("#000");

    // Table Rows
    order.items.forEach((item, index) => {
        const totalPrice = (item.finalPrice * item.quantity).toFixed(2);

        doc.rect(startX, currentY, pageWidth, 25).stroke();
        doc.text(`${index + 1}`, startX + 5, currentY + 7);
        doc.text(item.product.name, startX + colWidths[0] + 5, currentY + 7);
        doc.text(item.quantity.toString(), startX + colWidths[0] + colWidths[1] + 5, currentY + 7);
        doc.text(`Rs.${item.finalPrice.toFixed(2)}`, startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 7);
        doc.text(`Rs.${totalPrice}`, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, currentY + 7);

        currentY += 25;
    });

    // Line break before summary
    doc.moveDown();

    // Order Summary
    const summaryStartX = startX + pageWidth - 200; // Align right

    doc.font('Helvetica-Bold').text("Subtotal:", summaryStartX, currentY);
    doc.font('Helvetica').text(`Rs.${order.subtotal.toFixed(2)}`, summaryStartX + 100, currentY, { align: "right" });
    currentY += 20;

    doc.font('Helvetica-Bold').text("Tax:", summaryStartX, currentY);
    doc.font('Helvetica').text(`Rs.${order.tax.toFixed(2)}`, summaryStartX + 100, currentY, { align: "right" });
    currentY += 20;

    if (order.couponApplied) {
        doc.font('Helvetica-Bold').text("Coupon Discount:", summaryStartX, currentY);
        doc.font('Helvetica').text(`- Rs.${order.couponPrice.toFixed(2)}`, summaryStartX + 100, currentY, { align: "right" });
        currentY += 20;
    }

    doc.font('Helvetica-Bold').text("Shipping Charge:", summaryStartX, currentY);
    doc.font('Helvetica').text(`Rs.${order.shippingCharge.toFixed(2)}`, summaryStartX + 100, currentY, { align: "right" });
    currentY += 20;

    doc.moveDown();

    // Grand Total
    doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .text(`Grand Total: Rs.${order.totalAmount.toFixed(2)}`, summaryStartX, currentY, { align: "right" })
        .moveDown();

    // Thank You Note
    doc
        .font('Helvetica')
        .fontSize(12)
        .moveDown()
        .text('Thank you for your purchase!', { align: 'center' });

    // Finalize the PDF
    doc.end();
};

// const generateInvoice = (order, filePath) => {
//     const doc = new PDFDocument({ margin: 50 });

//     // Pipe the PDF to a file
//     doc.pipe(fs.createWriteStream(filePath));

//     // Header Section
//     doc
//         .fontSize(20)
//         .font('Helvetica-Bold')
//         .text('INVOICE', { align: 'center' })
//         .moveDown();

//     // Order & Customer Details
//     doc
//         .fontSize(12)
//         .font('Helvetica')
//         .text(`Order ID: ${order.orderId}`, { align: 'left' })
//         .text(`Order Date: ${order.createdAt.toDateString()}`, { align: 'left' })
//         .moveDown();

//     doc
//         .font('Helvetica-Bold')
//         .text('Bill To:', { underline: true })
//         .font('Helvetica')
//         .text(order.user.fullName)
//         .text(order.user.email)
//         .moveDown();

//     // Address Section
//     doc
//         .font('Helvetica-Bold')
//         .text('Billing Address:', { underline: true })
//         .font('Helvetica')
//         .text(`${order.address.hName}, ${order.address.street}`)
//         .text(`${order.address.city}, ${order.address.country}`)
//         .text(`PIN: ${order.address.pin}`)
//         .moveDown();

//     // Order Items Table
//     doc
//         .font('Helvetica-Bold')
//         .text('Order Items:', { underline: true })
//         .moveDown();

//     const startX = 50;
//     const colWidths = [40, 200, 60, 80, 80]; // Column widths
//     let currentY = doc.y;

//     // Table Headers
//     doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), 20).fillAndStroke("#000", "#000");
//     doc.fillColor("#fff")
//         .text('Sl No.', startX + 5, currentY + 5)
//         .text('Product', startX + colWidths[0] + 5, currentY + 5)
//         .text('Qty', startX + colWidths[0] + colWidths[1] + 5, currentY + 5)
//         .text('Price', startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 5)
//         .text('Total', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, currentY + 5);

//     currentY += 20;
//     doc.fillColor("#000");

//     // Table Rows
//     order.items.forEach((item, index) => {
//         const totalPrice = (item.finalPrice * item.quantity).toFixed(2);

//         doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), 20).stroke();
//         doc.text(`${index + 1}`, startX + 5, currentY + 5);
//         doc.text(item.product.name, startX + colWidths[0] + 5, currentY + 5);
//         doc.text(item.quantity.toString(), startX + colWidths[0] + colWidths[1] + 5, currentY + 5);
//         doc.text(`Rs.${item.finalPrice.toFixed(2)}`, startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 5);
//         doc.text(`Rs.${totalPrice}`, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, currentY + 5);

//         currentY += 20;
//     });

//     // Line break before summary
//     doc.moveDown();
//     doc.moveDown();

//     // Order Summary
//     const summaryStartX = startX + colWidths.reduce((a, b) => a + b, 0) - 160; // Align right

    

//     doc.font('Helvetica-Bold').text("Subtotal:", summaryStartX, currentY);
//     doc.font('Helvetica').text(`Rs.${order.subtotal.toFixed(2)}`, summaryStartX + 100, currentY, { align: "center" });
//     currentY += 20;

//     doc.font('Helvetica-Bold').text("Tax:", summaryStartX, currentY);
//     doc.font('Helvetica').text(`Rs.${order.tax.toFixed(2)}`, summaryStartX + 100, currentY, { align: "center" });
//     currentY += 20;

//     if (order.couponApplied) {
//         doc.font('Helvetica-Bold').text("Coupon Discount:", summaryStartX, currentY);
//         doc.font('Helvetica').text(`-Rs.${order.couponPrice.toFixed(2)}`, summaryStartX + 100, currentY, { align: "center" });
//         currentY += 20;
//     }

//     doc.font('Helvetica-Bold').text("Shipping Charge:", summaryStartX, currentY);
//     doc.font('Helvetica').text(`Rs.${order.shippingCharge.toFixed(2)}`, summaryStartX + 100, currentY, { align: "center" });
//     currentY += 20;

//     doc.moveDown();

//     // Grand Total
//     doc
//         .font('Helvetica-Bold')
//         .fontSize(14)
//         .text(`Grand Total: Rs.${order.totalAmount.toFixed(2)}`, summaryStartX, currentY, { align: "center" })
//         .moveDown();

//     // Thank You Note
//     doc
//         .font('Helvetica')
//         .fontSize(12)
//         .moveDown()
//         .text('Thank you for your purchase!', { align: 'left' });

//     // Finalize the PDF
//     doc.end();
// };



module.exports={generateInvoice};