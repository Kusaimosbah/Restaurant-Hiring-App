'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface PayrollData {
  workerId: string;
  workerName: string;
  workerEmail: string;
  totalHours: number;
  totalWages: number;
  timesheetCount: number;
}

interface PaymentRecord {
  paymentId: string;
  workerId: string;
  workerName: string;
  amount: number;
  hours: number;
  status: string;
  processedAt: string;
}

interface PayrollHistoryItem {
  id: string;
  workerId: string;
  workerName: string;
  workerEmail: string;
  date: string;
  hours: number;
  amount: number;
  status: string;
  createdAt: string;
}

export default function PayrollManagement() {
  const [payPeriodStart, setPayPeriodStart] = useState('');
  const [payPeriodEnd, setPayPeriodEnd] = useState('');
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PayrollHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'process' | 'history'>('process');

  // Set default pay period to last week
  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    setPayPeriodStart(lastWeek.toISOString().split('T')[0]);
    setPayPeriodEnd(today.toISOString().split('T')[0]);
  }, []);

  // Load payment history
  useEffect(() => {
    if (activeTab === 'history') {
      loadPaymentHistory();
    }
  }, [activeTab]);

  const loadPaymentHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/payroll/history');
      
      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data.payments || []);
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processPayroll = async () => {
    if (selectedWorkers.length === 0) {
      alert('Please select at least one worker');
      return;
    }

    if (!payPeriodStart || !payPeriodEnd) {
      alert('Please select pay period dates');
      return;
    }

    try {
      setIsProcessing(true);
      
      const response = await fetch('/api/payroll/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workerIds: selectedWorkers,
          payPeriodStart,
          payPeriodEnd
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Successfully processed ${data.payments.length} payments. Total: $${data.totalAmount.toFixed(2)}`);
        setSelectedWorkers([]);
        // Refresh history if on that tab
        if (activeTab === 'history') {
          loadPaymentHistory();
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error processing payroll:', error);
      alert('Failed to process payroll. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payroll Management</h1>
        <p className="text-gray-600">Process payments and manage payroll for your workers</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('process')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'process'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Process Payroll
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Payment History
          </button>
        </nav>
      </div>

      {activeTab === 'process' && (
        <div className="space-y-6">
          {/* Pay Period Selection */}
          <Card title="Pay Period" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={payPeriodStart}
                  onChange={(e) => setPayPeriodStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={payPeriodEnd}
                  onChange={(e) => setPayPeriodEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </Card>

          {/* Worker Selection */}
          <Card title="Select Workers" className="p-6">
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">
                Select workers to include in payroll processing. 
                (Note: In a real implementation, this would show actual workers from your restaurant)
              </p>
              
              {/* Mock worker list */}
              {['worker1', 'worker2', 'worker3'].map((workerId, index) => (
                <label key={workerId} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedWorkers.includes(workerId)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedWorkers(prev => [...prev, workerId]);
                      } else {
                        setSelectedWorkers(prev => prev.filter(id => id !== workerId));
                      }
                    }}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">
                    Worker {index + 1} (ID: {workerId})
                  </span>
                </label>
              ))}
            </div>
          </Card>

          {/* Process Button */}
          <div className="flex justify-end">
            <Button
              onClick={processPayroll}
              disabled={isProcessing || selectedWorkers.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Processing...' : 'Process Payroll'}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <Card title="Payment History" className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : paymentHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Worker
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payment.workerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payment.workerEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.hours || 0}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(payment.amount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No payment history found
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}