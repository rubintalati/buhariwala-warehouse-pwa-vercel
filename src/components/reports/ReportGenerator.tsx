'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  FileText,
  Download,
  Mail,
  FileCheck,
  Shield,
  Truck,
  Package,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import type { JobData, ItemData, ReportData } from '@/lib/pdf/pdf-generator'

interface ReportGeneratorProps {
  job: JobData
  items: ItemData[]
  currentUser: { id: string; name?: string; email?: string }
}

type ReportType = 'completion' | 'insurance' | 'delivery' | 'picking'

interface ReportTypeConfig {
  type: ReportType
  title: string
  description: string
  icon: React.ReactNode
  color: string
  disabled?: boolean
}

const reportTypes: ReportTypeConfig[] = [
  {
    type: 'completion',
    title: 'Job Completion Report',
    description: 'Complete inventory report for job closure',
    icon: <FileCheck className="w-5 h-5" />,
    color: 'bg-green-500'
  },
  {
    type: 'insurance',
    title: 'Insurance Claim Report',
    description: 'Detailed report for insurance claims with damage assessment',
    icon: <Shield className="w-5 h-5" />,
    color: 'bg-orange-500'
  },
  {
    type: 'delivery',
    title: 'Delivery Receipt',
    description: 'Proof of delivery with customer signature',
    icon: <Truck className="w-5 h-5" />,
    color: 'bg-blue-500'
  },
  {
    type: 'picking',
    title: 'Picking List',
    description: 'List of items to be packed for transport',
    icon: <Package className="w-5 h-5" />,
    color: 'bg-purple-500'
  }
]

export default function ReportGenerator({ job, items, currentUser }: ReportGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Email form state
  const [emailForm, setEmailForm] = useState({
    recipients: job.client_email || '',
    subject: '',
    message: `Dear ${job.client_name},\n\nPlease find attached the report for job ${job.job_number}.\n\nThank you for choosing Buhariwala Logistics.\n\nBest regards,\nBuhariwala Team`
  })

  const handleGenerateReport = async (includeEmail: boolean = false) => {
    if (!selectedReportType) return

    setIsGenerating(true)
    setGenerationStatus('generating')
    setErrorMessage('')

    try {
      const reportData: ReportData = {
        job,
        items,
        reportType: selectedReportType,
        generatedBy: currentUser.name || currentUser.email || currentUser.id,
        generatedAt: new Date()
      }

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate report')
      }

      // Handle PDF download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      const reportTypeName = reportTypes.find(rt => rt.type === selectedReportType)?.title || 'Report'
      const filename = `${reportTypeName.replace(/\s+/g, '_')}_${job.job_number}_${new Date().toISOString().split('T')[0]}.pdf`
      link.download = filename

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setGenerationStatus('success')

      // If email was requested, handle email sending
      if (includeEmail && emailForm.recipients && emailForm.recipients.trim()) {
        try {
          const emailResponse = await fetch('/api/reports/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reportData: reportData,
              emailConfig: {
                recipients: emailForm.recipients.split(',').map(email => email.trim()),
                subject: emailForm.subject || `${reportTypeName} - ${job.job_number}`,
                message: emailForm.message || `Please find the attached ${reportTypeName.toLowerCase()} for job ${job.job_number}.`
              }
            })
          })

          if (emailResponse.ok) {
            const emailResult = await emailResponse.json()
            console.log('Email sent successfully:', emailResult)
          } else {
            console.error('Email sending failed:', await emailResponse.text())
          }
        } catch (error) {
          console.error('Error sending email:', error)
        }
      }

      // Auto-close after success
      setTimeout(() => {
        setIsOpen(false)
        setSelectedReportType(null)
        setGenerationStatus('idle')
      }, 2000)

    } catch (error) {
      console.error('Error generating report:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate report')
      setGenerationStatus('error')
    } finally {
      setIsGenerating(false)
    }
  }

  const getReportTypeConfig = (type: ReportType): ReportTypeConfig => {
    return reportTypes.find(rt => rt.type === type) || reportTypes[0]
  }

  const handleEmailFormChange = (field: keyof typeof emailForm, value: string) => {
    setEmailForm(prev => ({ ...prev, [field]: value }))

    // Auto-generate subject if not manually set
    if (field === 'recipients' && selectedReportType && !emailForm.subject) {
      const config = getReportTypeConfig(selectedReportType)
      setEmailForm(prev => ({
        ...prev,
        subject: `${config.title} - ${job.job_number}`
      }))
    }
  }

  const canGenerateReports = items.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-primary text-white hover:bg-primary/90"
          disabled={!canGenerateReports}
        >
          <FileText className="w-4 h-4 mr-2" />
          Generate Reports
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Report for Job {job.job_number}
          </DialogTitle>
          <DialogDescription>
            Generate professional reports for your completed job. Select a report type and customize as needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Job Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Client:</span> {job.client_name}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {job.status.toUpperCase()}
                </div>
                <div>
                  <span className="font-medium">Total Items:</span> {items.reduce((sum, item) => sum + item.quantity, 0)}
                </div>
                <div>
                  <span className="font-medium">Estimated Value:</span> ₹{items.reduce((sum, item) => sum + (item.item_value || 0), 0).toLocaleString('en-IN')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Type Selection */}
          <div>
            <Label className="text-base font-medium">Select Report Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {reportTypes.map((reportType) => (
                <Card
                  key={reportType.type}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedReportType === reportType.type
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${reportType.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => !reportType.disabled && setSelectedReportType(reportType.type)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg text-white ${reportType.color}`}>
                        {reportType.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{reportType.title}</h3>
                        <p className="text-xs text-gray-600 mt-1">{reportType.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Email Configuration (if report type is selected) */}
          {selectedReportType && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="w-4 h-4" />
                  Email Configuration (Optional)
                </CardTitle>
                <CardDescription>
                  Send the generated report via email. Leave recipients blank to only download.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recipients">Recipients</Label>
                  <Input
                    id="recipients"
                    placeholder="email@example.com, another@example.com"
                    value={emailForm.recipients}
                    onChange={(e) => handleEmailFormChange('recipients', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={emailForm.subject}
                    onChange={(e) => handleEmailFormChange('subject', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={4}
                    value={emailForm.message}
                    onChange={(e) => handleEmailFormChange('message', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generation Status */}
          {generationStatus !== 'idle' && (
            <Card className={`border-2 ${
              generationStatus === 'success' ? 'border-green-200 bg-green-50' :
              generationStatus === 'error' ? 'border-red-200 bg-red-50' :
              'border-blue-200 bg-blue-50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {generationStatus === 'generating' && (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="text-blue-800">Generating report...</span>
                    </>
                  )}
                  {generationStatus === 'success' && (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-800">Report generated successfully!</span>
                    </>
                  )}
                  {generationStatus === 'error' && (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <div className="text-red-800 font-medium">Failed to generate report</div>
                        {errorMessage && (
                          <div className="text-red-700 text-sm mt-1">{errorMessage}</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={() => handleGenerateReport(false)}
              disabled={!selectedReportType || isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download PDF
            </Button>

            {emailForm.recipients && (
              <Button
                onClick={() => handleGenerateReport(true)}
                disabled={!selectedReportType || isGenerating}
                variant="outline"
                className="flex-1"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Download & Email
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}