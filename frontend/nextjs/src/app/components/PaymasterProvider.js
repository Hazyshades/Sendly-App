"use client";

import { createContext, useContext, useState } from 'react';

const PaymasterContext = createContext();

const BACKEND_URL = 'http://localhost:4000';

export function PaymasterProvider({ children }) {
  const [paymasterEnabled, setPaymasterEnabled] = useState(false);  // checkbox usePaymaster = FALSE

  const sponsorUserOperation = async (userOp, entryPoint, chainId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/sponsor-operation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userOperation: userOp,
          entryPoint,
          chainId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Sponsorship failed:', errorData);
        return null;
      }

      const sponsoredUserOp = await response.json();
      return sponsoredUserOp;
    } catch (error) {
      console.error('Paymaster sponsorship failed:', error);
      return null;
    }
  };

  return (
    <PaymasterContext.Provider
      value={{
        paymasterEnabled,
        setPaymasterEnabled,
        sponsorUserOperation,
      }}
    >
      {children}
    </PaymasterContext.Provider>
  );
}

export const usePaymaster = () => useContext(PaymasterContext);