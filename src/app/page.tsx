'use client';

import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Intro from '../components/Intro';
import ScrollyServices from '../components/ScrollyServices';
import TestimonialsSection from '../components/TestimonialsSection';
import OurServices from '../components/OurServices';
import TreatmentMethods from '../components/TreatmentMethods';
import InteractiveBodyDiagram from '../components/InteractiveBodyDiagram';
import BrandBanner from '../components/BrandBanner';
import Footer from '../components/Footer';
import BookingModal from '../components/BookingModal';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'home' | 'booking' | 'services' | 'about' | 'treatments'>('home');

  // Synchronize URL hash with the currentPage state on initial mount and hash changes
  useEffect(() => {
    const handleHashSync = () => {
      const hash = window.location.hash;
      if (hash === '#book') {
        setCurrentPage('booking');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (hash === '#our-services') {
        setCurrentPage('services');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (hash === '#treatments') {
        setCurrentPage('treatments');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (hash === '#about' || hash === '#body-diagram') {
        setCurrentPage('about');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (hash.includes('#')) {
        setCurrentPage('home');
        setTimeout(() => {
          const el = document.querySelector(hash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };
    handleHashSync();
    window.addEventListener('hashchange', handleHashSync);
    return () => window.removeEventListener('hashchange', handleHashSync);
  }, []);

  // Global click interception to catch page transitions like "#book", "#our-services", "#treatments", and "#about" / "#body-diagram"
  useEffect(() => {
    const handleHashClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href) {
          // Robust hash matching for page transitions
          if (href === '#book' || href.endsWith('#book')) {
            e.preventDefault();
            setCurrentPage('booking');
            window.scrollTo({ top: 0, behavior: 'instant' });
          } else if (href === '#our-services' || href.endsWith('#our-services')) {
            e.preventDefault();
            setCurrentPage('services');
            window.scrollTo({ top: 0, behavior: 'instant' });
          } else if (href === '#treatments' || href.endsWith('#treatments')) {
            e.preventDefault();
            setCurrentPage('treatments');
            window.scrollTo({ top: 0, behavior: 'instant' });
          } else if (href === '#about' || href.endsWith('#about') || href === '#body-diagram' || href.endsWith('#body-diagram')) {
            e.preventDefault();
            setCurrentPage('about');
            window.scrollTo({ top: 0, behavior: 'instant' });
          } else if (href === '/' || href === '' || href.endsWith('/')) {
            e.preventDefault();
            setCurrentPage('home');
            window.scrollTo({ top: 0, behavior: 'instant' });
          } else if ((currentPage === 'booking' || currentPage === 'services' || currentPage === 'about' || currentPage === 'treatments') && href.includes('#')) {
            // Return home and scroll to section anchor
            const hash = '#' + href.split('#')[1];
            e.preventDefault();
            setCurrentPage('home');
            setTimeout(() => {
              const el = document.querySelector(hash);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 50);
          }
        }
      }
    };

    document.addEventListener('click', handleHashClick);
    return () => document.removeEventListener('click', handleHashClick);
  }, [currentPage]);

  return (
    <>
      <Header />
      {currentPage === 'home' ? (
        <main>
          <Hero />
          <Intro />
          <ScrollyServices />
          <TestimonialsSection />
          <BrandBanner />
        </main>
      ) : currentPage === 'booking' ? (
        <main>
          <BookingModal onClose={() => setCurrentPage('home')} />
        </main>
      ) : currentPage === 'services' ? (
        <main>
          <OurServices onClose={() => setCurrentPage('home')} />
        </main>
      ) : currentPage === 'treatments' ? (
        <main>
          <TreatmentMethods 
            onClose={() => setCurrentPage('home')} 
            onBookClick={() => setCurrentPage('booking')} 
          />
        </main>
      ) : (
        <main>
          <InteractiveBodyDiagram 
            onClose={() => setCurrentPage('home')} 
            onBookClick={() => setCurrentPage('booking')} 
          />
        </main>
      )}
      <Footer />
    </>
  );
}
