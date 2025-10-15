'use client';

import MaterialViewer from '@/components/training/MaterialViewer';

export default function MaterialViewerPage({ params }: { params: { id: string } }) {
  return <MaterialViewer materialId={params.id} />;
}
