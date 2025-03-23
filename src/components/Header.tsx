
import React from 'react';
import { CreditCard } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="py-6 border-b">
      <div className="container flex items-center">
        <CreditCard className="h-6 w-6 mr-2 text-primary" />
        <h1 className="text-xl font-bold">Card Statement Standardizer</h1>
      </div>
    </header>
  );
};

export default Header;
