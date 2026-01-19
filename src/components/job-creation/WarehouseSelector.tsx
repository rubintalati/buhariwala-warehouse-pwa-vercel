'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Warehouse, MapPin, Phone, User } from 'lucide-react'

interface WarehouseData {
  id: string
  name: string
  address: string
  contact_name: string
  contact_phone: string
}

interface WarehouseSelectorProps {
  isWarehouseEnabled: boolean
  onWarehouseEnabledChange: (enabled: boolean) => void
  selectedWarehouseId: string | null
  onWarehouseSelect: (warehouseId: string | null) => void
  storageStartDate: string
  onStorageStartDateChange: (date: string) => void
  storageEndDate: string
  onStorageEndDateChange: (date: string) => void
}

export default function WarehouseSelector({
  isWarehouseEnabled,
  onWarehouseEnabledChange,
  selectedWarehouseId,
  onWarehouseSelect,
  storageStartDate,
  onStorageStartDateChange,
  storageEndDate,
  onStorageEndDateChange
}: WarehouseSelectorProps) {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadWarehouses()
  }, [])

  const loadWarehouses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/warehouses')
      const result = await response.json()

      if (response.ok) {
        setWarehouses(result.data)
      } else {
        console.error('Failed to load warehouses:', result.error)
      }
    } catch (error) {
      console.error('Error loading warehouses:', error)
    } finally {
      setLoading(false)
    }
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Warehouse className="w-5 h-5 text-orange-500" />
          Warehouse Storage
        </CardTitle>
        <CardDescription>
          Optional temporary storage at one of our warehouse facilities
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Enable Warehouse Storage Checkbox */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="warehouse-enabled"
            checked={isWarehouseEnabled}
            onChange={(e) => onWarehouseEnabledChange(e.target.checked)}
            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-600"
          />
          <label htmlFor="warehouse-enabled" className="text-sm font-medium">
            Store items in warehouse temporarily
          </label>
        </div>

        {isWarehouseEnabled && (
          <>
            {/* Storage Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div>
                <label className="block text-sm font-medium mb-2">Storage Start Date</label>
                <Input
                  type="date"
                  value={storageStartDate}
                  onChange={(e) => onStorageStartDateChange(e.target.value)}
                  required={isWarehouseEnabled}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Storage End Date</label>
                <Input
                  type="date"
                  value={storageEndDate}
                  onChange={(e) => onStorageEndDateChange(e.target.value)}
                  required={isWarehouseEnabled}
                />
              </div>
            </div>

            {/* Warehouse Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Select Warehouse *</label>
              {loading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading warehouses...</p>
                </div>
              ) : warehouses.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No warehouses available</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {warehouses.map((warehouse) => (
                    <div
                      key={warehouse.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedWarehouseId === warehouse.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                      onClick={() => onWarehouseSelect(warehouse.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-lg">{warehouse.name}</h4>
                        {selectedWarehouseId === warehouse.id && (
                          <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{warehouse.address}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span>{warehouse.contact_name}</span>
                          <Phone className="w-4 h-4 ml-2" />
                          <span>{warehouse.contact_phone}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}