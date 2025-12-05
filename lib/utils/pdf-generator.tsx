import html2pdf from "html2pdf.js"
import JSZip from "jszip"

export interface TicketData {
  ticketNumber: string
  name: string
  age: number
  class: string
  gender: string
  house: string
  photoUrl: string
  qrCodeDataUrl: string
}

export interface TemplateVariables {
  ticketNumber: string
  name: string
  age: string
  class: string
  gender: string
  house: string
  photoUrl: string
  qrCode: string
  houseColor: string
  houseIcon: string
}

const HOUSE_COLORS: Record<string, { bg: string; icon: string }> = {
  Love: { bg: "#dc2626", icon: "❤️" },
  Joy: { bg: "#eab308", icon: "😊" },
  Hope: { bg: "#2563eb", icon: "🌟" },
  Peace: { bg: "#16a34a", icon: "☮️" },
}

export async function generateSingleTicketPDF(ticketData: TicketData, templateHtml: string): Promise<Blob> {
  const variables: TemplateVariables = {
    ticketNumber: ticketData.ticketNumber,
    name: ticketData.name,
    age: ticketData.age.toString(),
    class: ticketData.class,
    gender: ticketData.gender,
    house: ticketData.house,
    photoUrl: ticketData.photoUrl || "/child-photo.jpg",
    qrCode: `<img src="${ticketData.qrCodeDataUrl}" alt="QR Code" style="width: 120px; height: 120px;" />`,
    houseColor: HOUSE_COLORS[ticketData.house]?.bg || "#000000",
    houseIcon: HOUSE_COLORS[ticketData.house]?.icon || "🎉",
  }

  // Replace all placeholders in template
  let html = templateHtml
  Object.entries(variables).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), String(value))
  })

  // Wrap in proper styling
  const styledHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; }
        .ticket-container {
          max-width: 400px;
          background: white;
          border: 2px solid #ddd;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .ticket-header {
          color: white;
          padding: 24px;
          text-align: center;
        }
        .ticket-icon { font-size: 48px; margin-bottom: 8px; }
        .ticket-house { font-size: 24px; font-weight: bold; margin: 8px 0; }
        .ticket-event { font-size: 12px; opacity: 0.9; }
        .ticket-content { padding: 24px; }
        .ticket-photo {
          width: 100%;
          height: 128px;
          background-size: cover;
          background-position: center;
          border-radius: 8px;
          border: 2px solid #ddd;
          margin-bottom: 16px;
        }
        .ticket-info { margin-bottom: 16px; }
        .info-item {
          display: block;
          margin-bottom: 12px;
        }
        .info-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
        .info-value { display: block; font-size: 16px; font-weight: bold; color: #000; }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 12px;
        }
        .info-grid .info-item { margin-bottom: 0; }
        .ticket-qr {
          display: flex;
          justify-content: center;
          padding: 16px;
          background: #f5f5f5;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        .ticket-qr img { max-width: 100%; }
        .ticket-number {
          text-align: center;
          padding: 12px;
          border-top: 2px solid #ddd;
          margin-bottom: 16px;
        }
        .number-label { font-size: 10px; color: #666; text-transform: uppercase; }
        .number-value { display: block; font-size: 18px; font-weight: bold; font-family: monospace; letter-spacing: 2px; }
        .ticket-footer {
          background: #f5f5f5;
          padding: 12px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 2px solid #ddd;
        }
      </style>
    </head>
    <body>${html}</body>
    </html>
  `

  return new Promise((resolve, reject) => {
    html2pdf()
      .set({
        margin: 10,
        filename: `ticket-${ticketData.ticketNumber}.pdf`,
        image: { type: "png", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      })
      .from(styledHtml)
      .toPdf()
      .get("pdf")
      .then((pdf: any) => {
        const blob = pdf.output("blob")
        resolve(blob)
      })
      .catch(reject)
  })
}

export async function generateBatchTicketsPDF(ticketsData: TicketData[], templateHtml: string): Promise<Blob> {
  const zip = new JSZip()

  for (const ticketData of ticketsData) {
    try {
      const pdfBlob = await generateSingleTicketPDF(ticketData, templateHtml)
      zip.file(`ticket-${ticketData.ticketNumber}.pdf`, pdfBlob)
    } catch (error) {
      console.error(`Error generating ticket ${ticketData.ticketNumber}:`, error)
    }
  }

  return zip.generateAsync({ type: "blob", compression: "DEFLATE" })
}
