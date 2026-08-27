'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AssessmentForm from '@/components/assessments/AssessmentForm';

export default function NewAssessmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId') || undefined;
  const parentAssessmentId = searchParams.get('parentAssessmentId') || undefined;

  return (
    <div className="p-6 md:p-8 select-none">
      <AssessmentForm
        initialPatientId={patientId}
        parentAssessmentId={parentAssessmentId}
        onSuccess={(id) => {
          router.push(`/crm360/assessments/${id}`);
        }}
        onCancel={() => {
          router.back();
        }}
      />
    </div>
  );
}
