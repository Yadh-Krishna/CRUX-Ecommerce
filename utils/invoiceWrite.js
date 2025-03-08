const PDFDocument = require('pdfkit');
const fs = require('fs');

const generateInvoice = (order, filePath) => {
    const doc = new PDFDocument({ margin: 50 });

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
        .text(`Order ID: ${order.orderId}`, { align: 'left' })
        .text(`Order Date: ${order.createdAt.toDateString()}`, { align: 'left' })
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
    const colWidths = [40, 200, 60, 80, 80];
    let currentY = doc.y;

    // Table Headers
    doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), 20).fillAndStroke("#000", "#000");
    doc.fillColor("#fff")
        .text('Sl No.', startX + 5, currentY + 5)
        .text('Product', startX + colWidths[0] + 5, currentY + 5)
        .text('Qty', startX + colWidths[0] + colWidths[1] + 5, currentY + 5)
        .text('Price', startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 5)
        .text('Total', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, currentY + 5);

    currentY += 20;
    doc.fillColor("#000");

    // Table Rows
    order.items.forEach((item, index) => {
        doc
            .rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), 20)
            .stroke();
        doc.text(`${index + 1}`, startX + 5, currentY + 5);
        doc.text(item.product.name, startX + colWidths[0] + 5, currentY + 5);
        doc.text(item.quantity.toString(), startX + colWidths[0] + colWidths[1] + 5, currentY + 5);
        doc.text(`₹${item.product.price.toFixed(2)}`, startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, currentY + 5);
        doc.text(`₹${(item.product.price * item.quantity).toFixed(2)}`, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, currentY + 5);
        currentY += 20;
    });

    // Total Amount Section
    doc
        .moveDown()
        .font('Helvetica-Bold')
        .text(`Subtotal: ₹${order.totalAmount.toFixed(2)}`, { align: 'right' })
        .moveDown();

    doc
        .font('Helvetica')
        .text('Thank you for your purchase!', { align: 'center' });

    // Finalize the PDF
    doc.end();
};

module.exports={generateInvoice};