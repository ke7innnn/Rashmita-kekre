/**
 * Automatic Patient Synchronization with Health 360 Calling Agent app
 * Endpoint: POST https://health360-nu.vercel.app/api/sync-patient
 */
export function syncPatientToCallingAgent(patient: {
  fullName?: string | null;
  name?: string | null;
  phone?: string | null;
  contact?: string | null;
  age?: string | number | null;
  dateOfBirth?: Date | string | null;
  treatmentModalityAssigned?: string | null;
  diagnosis?: string | null;
  presentingComplaint?: string | null;
  treatment?: string | null;
  condition?: string | null;
}) {
  try {
    const patient_name = patient.fullName || patient.name || 'Patient';
    const contact = patient.phone || patient.contact || '';
    
    let age = String(patient.age ?? '');
    if (!age && patient.dateOfBirth) {
      try {
        const dob = new Date(patient.dateOfBirth);
        if (!isNaN(dob.getTime())) {
          const diffMs = Date.now() - dob.getTime();
          const ageDt = new Date(diffMs);
          age = String(Math.abs(ageDt.getUTCFullYear() - 1970));
        }
      } catch (e) {
        // ignore
      }
    }

    const patient_type =
      patient.treatmentModalityAssigned ||
      patient.diagnosis ||
      patient.presentingComplaint ||
      patient.treatment ||
      patient.condition ||
      'General';

    fetch('https://health360-nu.vercel.app/api/sync-patient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_name,
        contact,
        age: age || 'N/A',
        patient_type,
      }),
    }).catch((err) => console.error('Calling Agent sync error:', err));
  } catch (e) {
    // Non-blocking, continue normal CRM operation
  }
}
