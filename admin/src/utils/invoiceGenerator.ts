
export interface InvoiceData {
  orderId: string;
  customer: string;
  email: string;
  address: string;
  date: string;
  products: Array<{
    name: string;
    model: string;
    quantity: number;
    price: string;
  }>;
  subtotal: string;
  shipping: string;
  total: string;
  paymentMethod?: string;
}

export const generateInvoiceHTML = (data: InvoiceData): string => {
  const formatCurrency = (amount: string) => {
    return amount.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ₫";
  };

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hóa đơn ${data.orderId}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .invoice-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .invoice-title {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .invoice-subtitle {
          font-size: 16px;
          opacity: 0.9;
        }
        .invoice-body {
          padding: 30px;
        }
        .invoice-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        .info-section h3 {
          color: #333;
          margin-bottom: 15px;
          font-size: 18px;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 5px;
        }
        .info-item {
          margin-bottom: 8px;
          color: #555;
        }
        .info-label {
          font-weight: bold;
          color: #333;
        }
        .products-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: white;
        }
        .products-table th {
          background: #f8f9fa;
          padding: 15px;
          text-align: left;
          font-weight: bold;
          color: #333;
          border-bottom: 2px solid #dee2e6;
        }
        .products-table td {
          padding: 15px;
          border-bottom: 1px solid #dee2e6;
        }
        .products-table tr:hover {
          background: #f8f9fa;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .summary-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-top: 20px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 5px 0;
        }
        .summary-total {
          font-size: 20px;
          font-weight: bold;
          color: #667eea;
          border-top: 2px solid #dee2e6;
          padding-top: 15px;
          margin-top: 15px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
          color: #666;
          font-size: 14px;
        }
        @media print {
          body { background: white; }
          .invoice-container { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-header">
          <div class="invoice-title">HÓA ĐƠN BÁN HÀNG</div>
          <div class="invoice-subtitle">Mã đơn hàng: ${data.orderId}</div>
        </div>
        
        <div class="invoice-body">
          <div class="invoice-info">
            <div class="info-section">
              <h3>Thông tin khách hàng</h3>
              <div class="info-item">
                <span class="info-label">Tên khách hàng:</span> ${data.customer}
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span> ${data.email}
              </div>
              <div class="info-item">
                <span class="info-label">Địa chỉ:</span> ${data.address}
              </div>
            </div>
            
            <div class="info-section">
              <h3>Thông tin hóa đơn</h3>
              <div class="info-item">
                <span class="info-label">Ngày lập:</span> ${new Date().toLocaleDateString('vi-VN')}
              </div>
              <div class="info-item">
                <span class="info-label">Ngày đặt hàng:</span> ${new Date(data.date).toLocaleDateString('vi-VN')}
              </div>
              <div class="info-item">
                <span class="info-label">Phương thức thanh toán:</span> ${data.paymentMethod || 'Thanh toán khi nhận hàng'}
              </div>
            </div>
          </div>
          
          <h3>Chi tiết sản phẩm</h3>
          <table class="products-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th class="text-center">Số lượng</th>
                <th class="text-right">Đơn giá</th>
                <th class="text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${data.products.map(product => `
                <tr>
                  <td>
                    <div style="font-weight: bold;">${product.name}</div>
                    <div style="color: #666; font-size: 14px;">${product.model}</div>
                  </td>
                  <td class="text-center">${product.quantity}</td>
                  <td class="text-right">${formatCurrency(product.price)}</td>
                  <td class="text-right">${formatCurrency((parseInt(product.price.replace(/,/g, '')) * product.quantity).toString())}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary-section">
            <div class="summary-row">
              <span>Tạm tính:</span>
              <span>${formatCurrency(data.subtotal)}</span>
            </div>
            <div class="summary-row">
              <span>Phí vận chuyển:</span>
              <span>${data.shipping === 'Miễn phí' ? 'Miễn phí' : formatCurrency(data.shipping)}</span>
            </div>
            <div class="summary-row summary-total">
              <span>Tổng cộng:</span>
              <span>${formatCurrency(data.total)}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Cảm ơn quý khách đã mua hàng!</p>
            <p>Mọi thắc mắc xin liên hệ: support@distributex.vn | Hotline: 1900-8888</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const downloadInvoice = (data: InvoiceData) => {
  const html = generateInvoiceHTML(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `hoa-don-${data.orderId.replace('#', '')}.html`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const printInvoice = (data: InvoiceData) => {
  const html = generateInvoiceHTML(data);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }
};
