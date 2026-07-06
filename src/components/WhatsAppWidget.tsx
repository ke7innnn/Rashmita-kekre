'use client';

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import './WhatsAppWidget.css';

export default function WhatsAppWidget() {
  const whatsappNumber = '918482812859';
  const message = encodeURIComponent("Hi HEALTH 360, I'd like to inquire about booking a physiotherapy assessment.");
  const url = `https://wa.me/${whatsappNumber}?text=${message}`;

  return (
    <div className="whatsapp-fab-container">
      <motion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-fab"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5, ease: 'easeOut' }}
        whileHover="hover"
        whileTap={{ scale: 0.92 }}
      >
        {/* Tooltip Tag */}
        <motion.div 
          className="whatsapp-tooltip"
          variants={{
            hover: { opacity: 1, x: -12, scale: 1 }
          }}
          initial={{ opacity: 0, x: 0, scale: 0.9 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          Chat with us
        </motion.div>

        {/* Outer Glow Ring */}
        <span className="whatsapp-glow-ring"></span>

        {/* WhatsApp Custom Complementary SVG Icon */}
        <svg 
          viewBox="0 0 24 24" 
          width="26" 
          height="26" 
          fill="currentColor"
          className="whatsapp-svg"
        >
          <path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.761.46 3.473 1.336 4.989L2 22l5.138-1.348a9.96 9.96 0 0 0 4.87 1.258h.004c5.502 0 9.988-4.482 9.988-9.988C22 6.482 17.514 2 12.012 2zm0 1.832c4.492 0 8.152 3.66 8.152 8.156 0 4.496-3.66 8.156-8.152 8.156-1.543 0-3.033-.443-4.321-1.282l-.31-.184-3.21.842.858-3.128-.202-.32a8.106 8.106 0 0 1-1.25-4.26c.002-4.496 3.662-8.156 8.165-8.156zm-3.328 3.51c-.179 0-.376.036-.532.176-.179.16-.694.678-.694 1.654s.711 1.916.809 2.052c.1.136 1.4 2.138 3.393 3.002.474.204.842.327 1.13.42.476.15.91.13 1.25.08.384-.058 1.18-.482 1.347-.946.168-.466.168-.864.118-.946-.05-.084-.18-.132-.377-.23-.197-.1-.17-.08-.344-.18l-.946-.466c-.198-.1-.346-.05-.494.15-.148.196-.566.72-.693.864-.13.146-.258.162-.456.064a5.753 5.753 0 0 1-1.688-1.042A6.34 6.34 0 0 1 8.76 7.424c-.1-.196-.01-.3-.11-.4.1-.1.197-.23.296-.345.1-.115.13-.196.197-.328.066-.13.033-.248-.016-.347-.049-.099-.444-1.074-.608-1.472z"/>
        </svg>
      </motion.a>
    </div>
  );
}
