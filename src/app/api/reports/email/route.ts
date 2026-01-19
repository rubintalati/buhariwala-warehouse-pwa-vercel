import { NextRequest, NextResponse } from 'next/server'
import { PDFGenerator, type ReportData } from '@/lib/pdf/pdf-generator'

interface EmailRequest {
  reportData: ReportData
  emailConfig: {
    recipients: string[]
    subject: string
    message: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reportData, emailConfig }: EmailRequest = body

    // Validate input
    if (!reportData || !emailConfig || !emailConfig.recipients?.length) {
      return NextResponse.json(
        { error: 'Invalid request data. Missing report data or email configuration.' },
        { status: 400 }
      )
    }

    // Generate PDF
    const pdfGenerator = new PDFGenerator()
    const pdfBlob = await pdfGenerator.generateReport(reportData)
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer())

    // Generate filename
    const reportTypeMap = {
      completion: 'Completion_Report',
      insurance: 'Insurance_Report',
      delivery: 'Delivery_Receipt',
      picking: 'Picking_List'
    }

    const reportTypeName = reportTypeMap[reportData.reportType] || 'Report'
    const filename = `${reportTypeName}_${reportData.job.job_number}_${new Date().toISOString().split('T')[0]}.pdf`

    // TODO: Implement actual email service integration
    // This is a placeholder for email service integration
    // You can integrate with services like:
    // - Supabase Edge Functions
    // - SendGrid
    // - Resend
    // - Nodemailer with SMTP

    // For now, we'll return a success response with the PDF data
    // In a real implementation, you would:
    // 1. Initialize your email service
    // 2. Create email with PDF attachment
    // 3. Send email to recipients
    // 4. Return success/failure response

    const emailResult = await simulateEmailSending({
      recipients: emailConfig.recipients,
      subject: emailConfig.subject,
      message: emailConfig.message,
      attachment: {
        filename,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    })

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        emailsSent: emailConfig.recipients.length,
        filename
      })
    } else {
      throw new Error(emailResult.error || 'Failed to send email')
    }

  } catch (error) {
    console.error('Error sending email with PDF:', error)
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Simulated email service - replace with actual implementation
async function simulateEmailSending(emailData: {
  recipients: string[]
  subject: string
  message: string
  attachment: {
    filename: string
    content: Buffer
    contentType: string
  }
}): Promise<{ success: boolean; error?: string }> {
  // Simulate email processing delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Validate email addresses
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const invalidEmails = emailData.recipients.filter(email => !emailRegex.test(email.trim()))

  if (invalidEmails.length > 0) {
    return {
      success: false,
      error: `Invalid email addresses: ${invalidEmails.join(', ')}`
    }
  }

  // For development/demo purposes, log the email details
  console.log('📧 Email Service (Simulated)')
  console.log('Recipients:', emailData.recipients)
  console.log('Subject:', emailData.subject)
  console.log('Message:', emailData.message.substring(0, 100) + '...')
  console.log('Attachment:', emailData.attachment.filename, `(${emailData.attachment.content.length} bytes)`)

  // Simulate success
  return { success: true }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      message: 'Email Service API',
      description: 'Send PDF reports via email',
      status: 'Available (Simulated)',
      supportedServices: [
        'Supabase Edge Functions',
        'SendGrid',
        'Resend',
        'Nodemailer SMTP'
      ],
      note: 'Currently using simulated email service for development. Configure with your preferred email provider.'
    },
    { status: 200 }
  )
}