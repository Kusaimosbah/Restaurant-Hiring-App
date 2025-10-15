'use client';

import ModuleDetail from '@/components/training/ModuleDetail';

export default function ModuleDetailPage({ params }: { params: { id: string } }) {
  return <ModuleDetail moduleId={params.id} />;
}
