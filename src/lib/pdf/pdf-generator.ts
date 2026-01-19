import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface JobData {
  id: string
  job_number: string
  client_name: string
  client_phone?: string
  client_email?: string
  pickup_location: string
  delivery_location?: string
  status: string
  created_at: string
  completed_at?: string
  total_estimated_value?: number
}

export interface ItemData {
  id: string
  job_id: string
  item_name: string
  category: string
  quantity: number
  condition: string
  item_value?: number
  dimensions?: string
  weight_estimate?: number
  handling_instructions?: string
  fragile: boolean
  ai_confidence_score?: number
  manual_verification: boolean
  created_at: string
  image_count?: number
}

export interface ReportData {
  job: JobData
  items: ItemData[]
  reportType: 'completion' | 'insurance' | 'delivery' | 'picking'
  generatedBy: string
  generatedAt: Date
  signatures?: {
    customer?: string
    staff?: string
  }
}

export class PDFGenerator {
  private pdf: jsPDF
  private pageWidth: number
  private pageHeight: number
  private margin: number
  private currentY: number

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.pdf.internal.pageSize.width
    this.pageHeight = this.pdf.internal.pageSize.height
    this.margin = 20
    this.currentY = this.margin
  }

  private addHeader(reportData: ReportData): void {
    const { job, reportType } = reportData

    // Company Logo Placeholder (will be replaced with actual logo)
    this.pdf.setFillColor(128, 14, 19) // Primary red color
    this.pdf.rect(this.margin, this.currentY, 40, 15, 'F')
    this.pdf.setTextColor(255, 255, 255)
    this.pdf.setFontSize(12)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('BUHARIWALA', this.margin + 2, this.currentY + 10)
    this.pdf.text('LOGISTICS', this.margin + 2, this.currentY + 13)

    // Company Details
    this.pdf.setTextColor(0, 0, 0)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setFontSize(10)
    const companyDetails = [
      'Enterprise Solutions',
      'Phone: +91 XXX XXX XXXX',
      'Email: info@buhariwala.com'
    ]

    let detailY = this.currentY + 5
    companyDetails.forEach(detail => {
      this.pdf.text(detail, this.margin + 45, detailY)
      detailY += 3.5
    })

    this.currentY += 20

    // Report Title
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setFontSize(16)
    this.pdf.setTextColor(128, 14, 19)
    const title = this.getReportTitle(reportType)
    this.pdf.text(title, this.pageWidth / 2, this.currentY, { align: 'center' })

    this.currentY += 10

    // Job Details Section
    this.pdf.setFillColor(245, 245, 245)
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 25, 'F')

    this.pdf.setTextColor(0, 0, 0)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setFontSize(12)
    this.pdf.text('Job Details', this.margin + 5, this.currentY + 7)

    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setFontSize(10)

    const leftColumn = [
      `Job Number: ${job.job_number}`,
      `Client: ${job.client_name}`,
      `Status: ${job.status.toUpperCase()}`
    ]

    const rightColumn = [
      `Date: ${new Date(job.created_at).toLocaleDateString('en-IN')}`,
      `Pickup: ${job.pickup_location}`,
      job.delivery_location ? `Delivery: ${job.delivery_location}` : ''
    ].filter(Boolean)

    let detailsY = this.currentY + 12
    leftColumn.forEach(detail => {
      this.pdf.text(detail, this.margin + 5, detailsY)
      detailsY += 4
    })

    detailsY = this.currentY + 12
    rightColumn.forEach(detail => {
      this.pdf.text(detail, this.pageWidth / 2 + 10, detailsY)
      detailsY += 4
    })

    this.currentY += 30
  }

  private addItemsTable(items: ItemData[], reportType: string): void {
    // Table Header
    this.pdf.setFillColor(128, 14, 19)
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 8, 'F')

    this.pdf.setTextColor(255, 255, 255)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setFontSize(9)

    const headers = ['Item Name', 'Category', 'Qty', 'Condition', 'Value (₹)', 'Notes']
    const colWidths = [50, 35, 15, 25, 25, 20]
    let headerX = this.margin + 2

    headers.forEach((header, index) => {
      this.pdf.text(header, headerX, this.currentY + 5.5)
      headerX += colWidths[index]
    })

    this.currentY += 8

    // Table Rows
    this.pdf.setTextColor(0, 0, 0)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setFontSize(8)

    items.forEach((item, index) => {
      // Check if we need a new page
      if (this.currentY > this.pageHeight - 40) {
        this.addNewPage()
      }

      // Alternating row colors
      if (index % 2 === 0) {
        this.pdf.setFillColor(250, 250, 250)
        this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 12, 'F')
      }

      let rowX = this.margin + 2
      const rowData = [
        this.truncateText(item.item_name, 45),
        this.truncateText(item.category, 30),
        item.quantity.toString(),
        item.condition.charAt(0).toUpperCase() + item.condition.slice(1),
        item.item_value ? `₹${item.item_value.toLocaleString('en-IN')}` : 'N/A',
        this.getItemNotes(item)
      ]

      // First row - main item details
      rowData.forEach((data, colIndex) => {
        this.pdf.text(data, rowX, this.currentY + 4)
        rowX += colWidths[colIndex]
      })

      // Second row - additional details
      let additionalInfo = []
      if (item.dimensions) additionalInfo.push(`Size: ${item.dimensions}`)
      if (item.fragile) additionalInfo.push('⚠ FRAGILE')
      if (item.handling_instructions) additionalInfo.push(`Special: ${this.truncateText(item.handling_instructions, 100)}`)

      if (additionalInfo.length > 0) {
        this.pdf.setFont('helvetica', 'italic')
        this.pdf.setFontSize(7)
        this.pdf.setTextColor(100, 100, 100)
        this.pdf.text(additionalInfo.join(' • '), this.margin + 2, this.currentY + 8)
        this.pdf.setFont('helvetica', 'normal')
        this.pdf.setFontSize(8)
        this.pdf.setTextColor(0, 0, 0)
        this.currentY += 12
      } else {
        this.currentY += 8
      }

      // Add a thin line after each row
      this.pdf.setDrawColor(200, 200, 200)
      this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
      this.currentY += 2
    })

    this.currentY += 5
  }

  private addSummary(reportData: ReportData): void {
    const { job, items } = reportData

    // Summary box
    this.pdf.setFillColor(248, 249, 250)
    this.pdf.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 25, 'F')

    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setFontSize(12)
    this.pdf.setTextColor(128, 14, 19)
    this.pdf.text('Summary', this.margin + 5, this.currentY + 7)

    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setFontSize(10)
    this.pdf.setTextColor(0, 0, 0)

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalValue = items.reduce((sum, item) => sum + (item.item_value || 0), 0)
    const damagedItems = items.filter(item => item.condition === 'damaged' || item.condition === 'poor').length
    const fragileItems = items.filter(item => item.fragile).length

    const summaryLeft = [
      `Total Items: ${totalItems}`,
      `Categories: ${new Set(items.map(i => i.category)).size}`,
      `Damaged Items: ${damagedItems}`
    ]

    const summaryRight = [
      `Total Estimated Value: ₹${totalValue.toLocaleString('en-IN')}`,
      `Fragile Items: ${fragileItems}`,
      `Generated: ${new Date().toLocaleString('en-IN')}`
    ]

    let summaryY = this.currentY + 12
    summaryLeft.forEach(item => {
      this.pdf.text(item, this.margin + 5, summaryY)
      summaryY += 4
    })

    summaryY = this.currentY + 12
    summaryRight.forEach(item => {
      this.pdf.text(item, this.pageWidth / 2 + 10, summaryY)
      summaryY += 4
    })

    this.currentY += 30
  }

  private addSignatures(signatures?: { customer?: string; staff?: string }): void {
    if (this.currentY > this.pageHeight - 60) {
      this.addNewPage()
    }

    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setFontSize(12)
    this.pdf.setTextColor(128, 14, 19)
    this.pdf.text('Signatures', this.margin, this.currentY)

    this.currentY += 10

    // Customer Signature
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setFontSize(10)
    this.pdf.setTextColor(0, 0, 0)

    const signatureWidth = (this.pageWidth - 3 * this.margin) / 2

    // Customer signature box
    this.pdf.rect(this.margin, this.currentY, signatureWidth, 25)
    this.pdf.text('Customer Signature', this.margin + 5, this.currentY + 20)
    this.pdf.text('Date: _______________', this.margin + 5, this.currentY + 23)

    // Staff signature box
    this.pdf.rect(this.pageWidth / 2 + 10, this.currentY, signatureWidth, 25)
    this.pdf.text('Staff Signature', this.pageWidth / 2 + 15, this.currentY + 20)
    this.pdf.text('Date: _______________', this.pageWidth / 2 + 15, this.currentY + 23)

    this.currentY += 30
  }

  private addFooter(): void {
    const footerY = this.pageHeight - 15

    this.pdf.setFont('helvetica', 'italic')
    this.pdf.setFontSize(8)
    this.pdf.setTextColor(100, 100, 100)

    this.pdf.text('This is a computer-generated report from Buhariwala Logistics Management System',
                  this.pageWidth / 2, footerY, { align: 'center' })
    this.pdf.text(`Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`,
                  this.pageWidth / 2, footerY + 3, { align: 'center' })

    // Page number
    const pageCount = this.pdf.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i)
      this.pdf.text(`Page ${i} of ${pageCount}`, this.pageWidth - this.margin, footerY, { align: 'right' })
    }
  }

  private addNewPage(): void {
    this.pdf.addPage()
    this.currentY = this.margin
  }

  private getReportTitle(reportType: string): string {
    switch (reportType) {
      case 'completion': return 'Job Completion Report'
      case 'insurance': return 'Insurance Claim Report'
      case 'delivery': return 'Delivery Receipt'
      case 'picking': return 'Picking List'
      default: return 'Inventory Report'
    }
  }

  private getItemNotes(item: ItemData): string {
    const notes = []
    if (item.ai_confidence_score && item.ai_confidence_score >= 0.8) notes.push('AI✓')
    if (item.manual_verification) notes.push('Review')
    if (item.fragile) notes.push('Fragile')
    return notes.join(', ')
  }

  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text
  }

  public async generateReport(reportData: ReportData): Promise<Blob> {
    try {
      // Add all sections
      this.addHeader(reportData)
      this.addItemsTable(reportData.items, reportData.reportType)
      this.addSummary(reportData)
      this.addSignatures(reportData.signatures)
      this.addFooter()

      // Return PDF as Blob
      return this.pdf.output('blob')
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Failed to generate PDF report')
    }
  }

  public async generateFromHTML(elementId: string, filename: string): Promise<Blob> {
    try {
      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error(`Element with ID ${elementId} not found`)
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      const pdf = new jsPDF('p', 'mm', 'a4')
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      return pdf.output('blob')
    } catch (error) {
      console.error('Error generating PDF from HTML:', error)
      throw new Error('Failed to generate PDF from HTML')
    }
  }
}

export const pdfGenerator = new PDFGenerator()