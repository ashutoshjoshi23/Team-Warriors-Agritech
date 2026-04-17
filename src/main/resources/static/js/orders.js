/**
 * ORDERS.JS — v3.0 D-Mart Style Billing System
 * Real-time orders from DB + PDF Invoice (no emojis, no Unicode symbols)
 */

let allOrders = [];
let currentFilter = 'ALL';

document.addEventListener('DOMContentLoaded', async () => {
    const session = Utils.getStorage('fc_session');
    if (!session || !session.isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    document.querySelectorAll('.status-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.status-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderOrders(allOrders);
        });
    });

    await fetchOrders(session.user);
});

async function fetchOrders(user) {
    try {
        const res = await fetch(`/api/orders/user/${user.id}`);
        if (!res.ok) throw new Error('Failed');
        allOrders = await res.json();
        updateStats(allOrders);
        renderOrders(allOrders);
    } catch (e) {
        document.getElementById('ordersList').innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-wifi"></i>
                <p style="font-weight:700;margin-bottom:8px;">Could not load orders</p>
                <button class="btn btn-primary" style="margin-top:16px;" onclick="location.reload()">
                    <i class="fa-solid fa-rotate-right"></i> Retry
                </button>
            </div>`;
    }
}

function updateStats(orders) {
    const spent   = orders.reduce((s, o) => s + (parseFloat(o.totalAmount) || 0), 0);
    const pending = orders.filter(o => ['PENDING_PAYMENT','PENDING','CONFIRMED','PROCESSING'].includes(o.status)).length;
    const done    = orders.filter(o => ['DELIVERED','PAID','COMPLETED'].includes(o.status)).length;
    setEl('ostTotal',   Utils.formatCurrency(spent));
    setEl('ostOrders',  orders.length);
    setEl('ostPending', pending);
    setEl('ostDone',    done);
}

function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function renderOrders(orders) {
    const list = document.getElementById('ordersList');
    const filtered = currentFilter === 'ALL'
        ? orders
        : orders.filter(o => (o.status || 'PENDING') === currentFilter);

    if (!filtered.length) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-box-open"></i>
                <p style="font-weight:700;margin-bottom:8px;color:var(--text-primary);">
                    ${currentFilter === 'ALL' ? 'No orders yet!' : 'No ' + currentFilter.replace(/_/g,' ') + ' orders'}
                </p>
                ${currentFilter === 'ALL' ? `<a href="products.html" class="btn btn-primary" style="margin-top:18px;display:inline-flex;"><i class="fa-solid fa-basket-shopping"></i> Shop Now</a>` : ''}
            </div>`;
        return;
    }

    const sorted = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    list.innerHTML = sorted.map(o => buildOrderCard(o)).join('');
}

function buildOrderCard(order) {
    const sc    = 's-' + (order.status || 'PENDING').replace(/ /g,'_');
    const sl    = (order.status || 'PENDING').replace(/_/g,' ');
    const date  = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
    const total = Utils.formatCurrency(parseFloat(order.totalAmount) || 0);
    const items = order.items || [];

    const itemsHTML = items.map(item => `
        <div class="order-item-row">
            <img src="${item.product?.image||''}" alt="${item.product?.name||'Product'}"
                 onerror="this.src='https://images.unsplash.com/photo-1543362906-acfc16c67564?w=100'">
            <div>
                <div class="oitem-name">${item.product?.name||'Product'}</div>
                <div class="oitem-meta">Qty: ${item.quantity} x ${Utils.formatCurrency(item.price)}
                    ${item.product?.category?`<span style="margin-left:8px;opacity:0.7;">· ${item.product.category}</span>`:''}
                </div>
            </div>
            <div class="oitem-price">${Utils.formatCurrency(item.price*item.quantity)}</div>
        </div>`).join('');

    return `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <div class="order-id"><i class="fa-solid fa-receipt" style="color:var(--primary-color);margin-right:8px;"></i>#ORD-${order.id}</div>
                    <div class="order-date"><i class="fa-regular fa-calendar"></i> ${date}</div>
                    ${order.shippingAddress?`<div class="order-date" style="margin-top:4px;"><i class="fa-solid fa-location-dot"></i> ${order.shippingAddress}</div>`:''}
                </div>
                <div class="order-meta">
                    <span class="status-badge ${sc}">${sl}</span>
                    <button class="invoice-btn" onclick="downloadInvoice(${order.id})">
                        <i class="fa-solid fa-file-pdf"></i> Download Invoice
                    </button>
                </div>
            </div>
            <div class="order-items-list">${itemsHTML||'<p style="color:var(--text-secondary);text-align:center;padding:20px;">No item details available</p>'}</div>
            <div class="order-footer">
                <div style="color:var(--text-secondary);font-size:0.85rem;">
                    <i class="fa-solid fa-truck"></i> Free Delivery
                    ${order.razorpayPaymentId?`&nbsp;&bull;&nbsp;<i class="fa-solid fa-shield-check" style="color:var(--success);"></i> Ref: ${order.razorpayPaymentId}`:''}
                </div>
                <div class="order-total">Total: <span>${total}</span></div>
            </div>
        </div>`;
}

// ============================================================
// D-MART STYLE PDF INVOICE  — ASCII only, no emojis/Unicode
// ============================================================
window.downloadInvoice = function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) { Utils.showToast('Order not found.', 'error'); return; }

    const session = Utils.getStorage('fc_session');
    const user    = session?.user || {};
    const { jsPDF } = window.jspdf;
    const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const mg    = 15;
    let y       = 0;

    // ---- HEADER ----
    doc.setFillColor(27, 67, 50);
    doc.rect(0, 0, pageW, 36, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('FarmConnect', mg, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 230, 190);
    doc.text('Farm-to-Table Marketplace  |  100% Organic Produce', mg, 21);
    doc.text('NMIET, Talegaon Dabhade, Pune - 410507', mg, 26);
    doc.text('GSTIN: 27AABCF1234M1Z5  |  support@farmconnect.in  |  +91 2114 231 666', mg, 31);

    // TAX INVOICE stamp
    doc.setFillColor(212, 163, 115);
    doc.roundedRect(pageW - 52, 9, 40, 13, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('TAX INVOICE', pageW - 32, 17, { align: 'center' });

    // ---- INVOICE + BILL TO SECTION (starts after 36px header) ----
    y = 44;

    // Pre-calculate address wrap width (right half minus margins)
    const col2     = pageW / 2 + 4;
    const addrMaxW = pageW - mg - col2 - 2;
    doc.setFontSize(8);
    const addrLines = order.shippingAddress
        ? doc.splitTextToSize(order.shippingAddress, addrMaxW)
        : [];
    const boxH = 30 + Math.max(0, addrLines.length - 1) * 5;

    // Draw box AFTER height is known
    doc.setFillColor(245, 248, 245);
    doc.roundedRect(mg, y, pageW - mg * 2, boxH, 3, 3, 'F');

    const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
    });

    // LEFT — Invoice Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(45, 106, 79);
    doc.text('INVOICE DETAILS', mg + 4, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('Invoice No. : INV-FC-' + String(order.id).padStart(6, '0'), mg + 4, y + 14);
    doc.text('Order ID   : #ORD-' + order.id,                             mg + 4, y + 20);
    doc.text('Date       : ' + orderDate,                                 mg + 4, y + 26);

    // RIGHT — Bill To
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 106, 79);
    doc.text('BILL TO', col2, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('Name    : ' + (user.name  || 'Customer'), col2, y + 14);
    doc.text('Email   : ' + (user.email || '-'),        col2, y + 20);

    if (addrLines.length > 0) {
        doc.text('Addr    : ' + addrLines[0], col2, y + 26);
        for (let li = 1; li < addrLines.length; li++) {
            doc.text('           ' + addrLines[li], col2, y + 26 + li * 5);
        }
    }

    y += boxH + 6;


    // ---- STATUS PILL ----
    const paid  = ['DELIVERED','PAID','COMPLETED','CONFIRMED'].includes(order.status);
    const sText = paid ? 'STATUS: PAID' : 'STATUS: ' + (order.status || 'PENDING').replace(/_/g, ' ');
    doc.setFillColor(paid ? 209 : 254, paid ? 250 : 242, paid ? 229 : 229);
    doc.roundedRect(mg, y, 55, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(paid ? 6 : 153, paid ? 95 : 50, paid ? 70 : 50);
    doc.text(sText, mg + 27, y + 5.5, { align: 'center' });

    if (order.razorpayPaymentId) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100);
        doc.text('Payment Ref: ' + order.razorpayPaymentId, mg + 60, y + 5.5);
    }

    y += 14;

    // ---- ITEMS TABLE ----
    const items = order.items || [];
    const fmtN  = n => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(n);

    doc.autoTable({
        startY: y,
        head: [['#', 'Product', 'Category', 'Qty', 'Unit Price (Rs.)', 'Amount (Rs.)']],
        body: items.map((item, i) => [
            i + 1,
            item.product?.name || 'Product',
            item.product?.category || '-',
            item.quantity,
            fmtN(item.price),
            fmtN(item.price * item.quantity)
        ]),
        margin: { left: mg, right: mg },
        styles: { fontSize: 9, cellPadding: 3.5, textColor: [40, 40, 40], font: 'helvetica' },
        headStyles: { fillColor: [27, 67, 50], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            3: { halign: 'center', cellWidth: 14 },
            4: { halign: 'right', cellWidth: 34 },
            5: { halign: 'right', cellWidth: 32 }
        },
        alternateRowStyles: { fillColor: [247, 252, 248] }
    });

    y = doc.lastAutoTable.finalY + 8;

    // ---- TOTALS BOX ----
    const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
    const gst      = subtotal * 0.08;
    const grand    = parseFloat(order.totalAmount) || (subtotal + gst);
    const boxX     = pageW - mg - 82;

    doc.setFillColor(245, 250, 246);
    doc.roundedRect(boxX, y, 82, 46, 3, 3, 'F');
    doc.setDrawColor(180, 220, 190);
    doc.setLineWidth(0.5);
    doc.roundedRect(boxX, y, 82, 46, 3, 3, 'S');

    const R = pageW - mg - 3;
    const L = boxX + 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);

    doc.text('Subtotal:', L, y + 10);
    doc.text('Rs. ' + fmtN(subtotal), R, y + 10, { align: 'right' });

    doc.text('Delivery Charges:', L, y + 20);
    doc.setTextColor(22, 163, 74);
    doc.text('FREE', R, y + 20, { align: 'right' });

    doc.setTextColor(70, 70, 70);
    doc.text('GST @ 8%:', L, y + 30);
    doc.text('Rs. ' + fmtN(gst), R, y + 30, { align: 'right' });

    doc.setDrawColor(45, 106, 79);
    doc.setLineWidth(0.6);
    doc.line(L, y + 34, R, y + 34);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(27, 67, 50);
    doc.text('GRAND TOTAL:', L, y + 43);
    doc.text('Rs. ' + fmtN(grand), R, y + 43, { align: 'right' });

    // ---- FOOTER ----
    doc.setFillColor(27, 67, 50);
    doc.rect(0, pageH - 26, pageW, 26, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Thank you for shopping with FarmConnect!', pageW / 2, pageH - 16, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 230, 190);
    doc.text('This is a system-generated invoice. No physical signature required.', pageW / 2, pageH - 9, { align: 'center' });
    doc.text('support@farmconnect.in  |  +91 2114 231 666', pageW / 2, pageH - 4, { align: 'center' });

    doc.save('FarmConnect_Invoice_ORD-' + order.id + '.pdf');
    Utils.showToast('Invoice downloaded successfully!');
};
