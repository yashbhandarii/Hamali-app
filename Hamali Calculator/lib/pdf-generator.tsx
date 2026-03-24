import type { DailyRecord } from "@/types/labor"

export const generatePDF = async (record: DailyRecord): Promise<void> => {
  // Create a new window for the PDF content
  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    throw new Error("Unable to open print window")
  }

  const { date, time } = formatDateTime(record.createdAt)

  // Generate HTML content for the PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Labor Charges Report - ${date}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #1e293b;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #1e293b;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #1e293b;
          font-size: 24px;
          margin: 0;
          font-weight: bold;
        }
        .header p {
          color: #64748b;
          margin: 5px 0;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding: 15px;
          background-color: #f8fafc;
          border: 2px solid #1e293b;
          border-radius: 8px;
        }
        .info-item {
          text-align: center;
        }
        .info-label {
          font-weight: bold;
          color: #1e293b;
          font-size: 12px;
          text-transform: uppercase;
        }
        .info-value {
          font-size: 16px;
          color: #1e293b;
          margin-top: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          border: 2px solid #1e293b;
        }
        th {
          background-color: #1e293b;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: bold;
          font-size: 14px;
        }
        th.center { text-align: center; }
        th.right { text-align: right; }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        td.center { text-align: center; }
        td.right { text-align: right; }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .total-row {
          background-color: #fef3e2 !important;
          border-top: 2px solid #1e293b;
          font-weight: bold;
        }
        .total-row td {
          color: #1e293b;
          font-size: 16px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #64748b;
          font-size: 12px;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>LABOR CHARGES REPORT</h1>
        <p>Daily Calculation Summary</p>
      </div>
      
      <div class="info-section">
        <div class="info-item">
          <div class="info-label">Date</div>
          <div class="info-value">${date}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Time</div>
          <div class="info-value">${time}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Categories</div>
          <div class="info-value">${record.categories.length}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Total Bags</div>
          <div class="info-value">${record.categories.reduce((sum, cat) => sum + cat.bags, 0)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th class="center">Bags</th>
            <th class="center">Rate per Bag</th>
            <th class="right">Total Charge</th>
            <th>Comment</th>
          </tr>
        </thead>
        <tbody>
          ${record.categories
            .map(
              (category) => `
            <tr>
              <td>${category.categoryName}</td>
              <td class="center">${category.bags}</td>
              <td class="center">₹${category.chargePerBag.toFixed(2)}</td>
              <td class="right">₹${category.totalCharge.toFixed(2)}</td>
              <td>${(category as any).comment || ""}</td>
            </tr>
          `,
            )
            .join("")}
          <tr class="total-row">
            <td colspan="3" class="right">GRAND TOTAL:</td>
            <td class="right">₹${record.grandTotal.toFixed(2)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>Labor Charges Calculator - Professional Billing System</p>
      </div>
    </body>
    </html>
  `

  // Write content to the new window
  printWindow.document.write(htmlContent)
  printWindow.document.close()

  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }
}

const formatDateTime = (isoString: string) => {
  const date = new Date(isoString)
  return {
    date: date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    time: date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  }
}
