// CompletionScreen.tsx
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircleOutlined } from '@ant-design/icons';
import './CompletionScreen.css'; // Optional: for additional styling

interface CompletionScreenProps {
  onComplete: () => void;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000); // Duration before navigation (2 seconds)

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="completion-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <CheckCircleOutlined style={{ fontSize: '64px', color: '#52c41a' }} />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{ marginTop: '20px' }}
      >
        Task Completed
      </motion.h1>
    </motion.div>
  );
};

export default CompletionScreen;
