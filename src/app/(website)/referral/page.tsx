'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReferralForm from '@/components/ReferralForm';

export default function ReferralPage() {
  return (
    <>
      <Header />
      <main>
        <ReferralForm />
      </main>
      <Footer />
    </>
  );
}
