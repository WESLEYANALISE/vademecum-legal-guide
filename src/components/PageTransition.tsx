import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0.6, x: '3%' }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        type: 'tween', 
        duration: 0.15,
        ease: 'easeOut',
      }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
