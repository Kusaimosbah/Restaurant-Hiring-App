import { Metadata } from 'next';
import SecurityDashboard from '@/components/SecurityDashboard';

export const metadata: Metadata = {
  title: 'Security & Privacy Settings',
  description: 'Manage your account security and privacy settings',
};

export default function SecurityPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SecurityDashboard />
    </div>
  );
}