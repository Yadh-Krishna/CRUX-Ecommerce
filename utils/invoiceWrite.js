const PDFDocument = require('pdfkit');
const fs = require('fs');


const generateInvoice = (order, item, filePath) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Pipe the PDF to a file
    doc.pipe(fs.createWriteStream(filePath));

    // Header Section
    doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', { align: 'center' }).moveDown();

    // Order & Customer Details
    doc.fontSize(12).font('Helvetica').text(`Order ID: ${order.orderId}`);
    doc.text(`Order Date: ${order.createdAt.toDateString()}`).moveDown();

    // Customer Details
    doc.font('Helvetica-Bold').text('Bill To:', { underline: true });
    doc.font('Helvetica').text(order.user.fullName);
    doc.text(order.user.email).moveDown();

    // Address Section
    doc.font('Helvetica-Bold').text('Billing Address:', { underline: true });
    doc.font('Helvetica').text(`${order.address.hName}, ${order.address.street}`);
    doc.text(`${order.address.city}, ${order.address.country}`);
    doc.text(`PIN: ${order.address.pin}`).moveDown();

    // Order Item Details
    doc.font('Helvetica-Bold').text('Item Details:', { underline: true }).moveDown();

    const startX = 50;
    const pageWidth = doc.page.width - 100;
    const colWidths = [50, 250, 80, 80, 80];
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

    // Single Item Row
    const totalPrice = (item.finalPrice * item.quantity).toFixed(2);

    doc.rect(startX, currentY, pageWidth, 25).stroke();
    doc.text(`1`, startX + 5, currentY + 7);
    doc.text(item.product.name, startX + colWidths[0] + 5, currentY + 7);
    doc.text(item.quantity.toString(), startX + colWidths[0] + colWidths[1] + 5, currentY + 7);
    doc.text(`${item.finalPrice.toFixed(2)}`, startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 7);
    doc.text(`${totalPrice}`, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, currentY + 7);

    currentY += 25;

    // Order Summary
    const summaryStartX = startX + pageWidth - 200;

    doc.font('Helvetica-Bold').text("Subtotal:", summaryStartX, currentY);
    doc.font('Helvetica').text(`Rs.${totalPrice}`, summaryStartX + 100, currentY, { align: "right" });
    currentY += 20;

    
    doc.font('Helvetica-Bold').text("Tax:", summaryStartX, currentY);
    doc.font('Helvetica').text(`Rs.${(0.1 * totalPrice).toFixed(2)}`, summaryStartX + 100, currentY, { align: "right" });
    currentY += 20;

    // if (order.couponApplied) {
    //     doc.font('Helvetica-Bold').text("Coupon Discount:", summaryStartX, currentY);
    //     doc.font('Helvetica').text(`- Rs.${((order.couponPrice / order.totalAmount) * totalPrice).toFixed(2)}`, summaryStartX + 100, currentY, { align: "right" });
    //     currentY += 20;
    // }

    

    doc.font('Helvetica-Bold').text("Shipping Charge:", summaryStartX, currentY);
    doc.font('Helvetica').text(`Rs.${(totalPrice> 1000 ? 0: 50).toFixed(2)}`, summaryStartX + 100, currentY, { align: "right" });
    currentY += 20;

    doc.moveDown();
    
    

    // Grand Total
    doc.font('Helvetica-Bold').fontSize(14)
        .text(`Grand Total: Rs.${totalPrice+(0.1 * totalPrice)+(totalPrice > 1000 ? 0: 50).toFixed(2)}`, summaryStartX, currentY, { align: "right" })
        .moveDown();

    // Thank You Note
    doc.font('Helvetica').fontSize(12).moveDown()
        .text('Thank you for your purchase!', { align: 'center' });

    // Finalize the PDF
    doc.end();
};



module.exports={generateInvoice};