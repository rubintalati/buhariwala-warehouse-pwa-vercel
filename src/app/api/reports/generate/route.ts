import { NextRequest, NextResponse } from 'next/server'
import { PDFGenerator, type ReportData } from '@/lib/pdf/pdf-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportData }: { reportData: ReportData } = body

    if (!reportData || !reportData.job || !reportData.items) {
      return NextResponse.json(
        { error: 'Invalid report data provided' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!reportData.job.id || !reportData.job.job_number || !reportData.job.client_name) {
      return NextResponse.json(
        { error: 'Missing required job information' },
        { status: 400 }
      )
    }

    // Generate PDF
    const pdfGenerator = new PDFGenerator()
    const pdfBlob = await pdfGenerator.generateReport(reportData)

    // Convert blob to buffer for response
    const buffer = Buffer.from(await pdfBlob.arrayBuffer())

    // Generate filename
    const reportTypeMap = {
      completion: 'Completion_Report',
      insurance: 'Insurance_Report',
      delivery: 'Delivery_Receipt',
      picking: 'Picking_List'
    }

    const reportTypeName = reportTypeMap[reportData.reportType] || 'Report'
    const filename = `${reportTypeName}_${reportData.job.job_number}_${new Date().toISOString().split('T')[0]}.pdf`

    // Return PDF as download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Error generating PDF report:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate PDF report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      message: 'PDF Report Generator API',
      endpoints: {
        'POST /api/reports/generate': 'Generate PDF report from job data',
        'POST /api/reports/email': 'Email PDF report to recipients'
      },
      supportedReportTypes: [
        'completion',
        'insurance',
        'delivery',
        'picking'
      ]
    },
    { status: 200 }
  )
}