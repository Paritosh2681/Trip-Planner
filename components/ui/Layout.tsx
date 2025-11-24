import React from 'react';

export const Section: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({ children, className = '', id }) => (
  <section id={id} className={`w-full max-w-[1600px] mx-auto px-6 md:px-12 py-16 md:py-24 ${className}`}>
    {children}
  </section>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' }> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "rounded-none uppercase tracking-[0.2em] text-sm font-bold py-4 px-8 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-black text-white hover:bg-neutral-800 border border-black",
    outline: "bg-transparent text-black border border-black hover:bg-black hover:text-white"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input 
    className={`
      w-full bg-transparent border-b-2 border-neutral-300 py-4 text-3xl md:text-5xl font-display font-light text-black 
      placeholder-neutral-300 focus:outline-none focus:border-black transition-colors duration-300 rounded-none
      ${className}
    `}
    {...props} 
  />
);
