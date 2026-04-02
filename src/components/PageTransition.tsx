import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      transition={{ 
        type: 'spring', 
        damping: 25, 
        stiffness: 200,
        mass: 0.8
      }}
      className="min-h-screen"
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
