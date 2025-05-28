'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Import mock data for one-time seeding
import mockPlaidData from '@/data/mockPlaid.json';

// --- Enums for Account and Transaction Types ---
export enum BankAccountType {
  CHECKING = 'Checking',
  SAVINGS = 'Savings',
  CREDIT_CARD = 'Credit Card',
}

export enum BankingTransactionType {
  DEBIT = 'DEBIT', // Money out of a debit account, or new charge on a credit card
  CREDIT = 'CREDIT', // Money into a debit account, or payment to a credit card
}

// --- Interfaces ---
export interface BankAccount {
  id: string;
  name: string; // e.g., "BoA Checking", "Chase Sapphire Preferred"
  type: BankAccountType;
  institution?: string; // e.g., "Bank of America", "Chase"
  accountNumberLast4?: string; // Optional: last 4 digits
  // For CHECKING/SAVINGS, this is the actual balance.
  // For CREDIT_CARD, this is the amount owed (statement balance or current running balance).
  currentBalance: number; 
  // User-defined flags
  isPrimaryPaycheckAccount?: boolean;
  isPrimaryRentAccount?: boolean;
  notes?: string;
}

export interface BankingTransaction {
  id: string;
  accountId: string; // Links to BankAccount.id
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // Always positive. The 'type' determines if it's inflow/outflow.
  type: BankingTransactionType; // DEBIT or CREDIT relative to the account
  category?: string; // e.g., "Income", "Rent", "Groceries", "Credit Card Payment"
  notes?: string;
}

// --- Hook Result Interface ---
export interface BankingManagerHookResult {
  bankAccounts: BankAccount[];
  bankingTransactions: BankingTransaction[];
  isLoadingBankingData: boolean;
  addBankAccount: (account: Omit<BankAccount, 'id' | 'currentBalance'> & { initialBalance?: number }) => void;
  // TODO: add updateBankAccount
  removeBankAccount: (accountId: string) => void;
  addBankingTransaction: (transaction: Omit<BankingTransaction, 'id'>) => void;
  // TODO: add updateBankingTransaction
  removeBankingTransaction: (transactionId: string) => void;
  getAccountBalance: (accountId: string) => number;
  // TODO: Consider adding functions for fetching transactions by account, etc.
}

// --- Default Accounts (as requested by user) ---
const DEFAULT_ACCOUNTS_DATA: Array<Omit<BankAccount, 'id' | 'currentBalance'> & { initialBalance: number }> = [
  { name: 'BoA Checking', type: BankAccountType.CHECKING, institution: 'Bank of America', initialBalance: 0, isPrimaryPaycheckAccount: true },
  { name: 'BoA Savings', type: BankAccountType.SAVINGS, institution: 'Bank of America', initialBalance: 0 },
  { name: 'Chase Credit Card', type: BankAccountType.CREDIT_CARD, institution: 'Chase', initialBalance: 0 },
  { name: 'Amex Credit Card', type: BankAccountType.CREDIT_CARD, institution: 'American Express', initialBalance: 0 },
  { name: 'Bilt Credit Card', type: BankAccountType.CREDIT_CARD, institution: 'Bilt Rewards', initialBalance: 0, isPrimaryRentAccount: true },
];


// --- The Hook ---
export function useBankingManager(): BankingManagerHookResult {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankingTransactions, setBankingTransactions] = useState<BankingTransaction[]>([]);
  const [isLoadingBankingData, setIsLoadingBankingData] = useState(true);

  // Initialize default accounts if none exist in localStorage
  useEffect(() => {
    let currentAccounts: BankAccount[] = [];
    const storedAccounts = localStorage.getItem('userBankAccounts');
    if (!storedAccounts || JSON.parse(storedAccounts).length === 0) {
      console.log('[BankingManager] Initializing default bank accounts.');
      const initialAccounts: BankAccount[] = DEFAULT_ACCOUNTS_DATA.map(acc => ({
        ...acc,
        id: uuidv4(),
        currentBalance: acc.initialBalance,
      }));
      setBankAccounts(initialAccounts);
      localStorage.setItem('userBankAccounts', JSON.stringify(initialAccounts));
      currentAccounts = initialAccounts;
    } else {
      try {
        currentAccounts = JSON.parse(storedAccounts);
        setBankAccounts(currentAccounts);
      } catch (e) {
        console.error("Error parsing stored bank accounts:", e);
        const initialAccounts: BankAccount[] = DEFAULT_ACCOUNTS_DATA.map(acc => ({
            ...acc,
            id: uuidv4(),
            currentBalance: acc.initialBalance,
        }));
        setBankAccounts(initialAccounts);
        currentAccounts = initialAccounts;
      }
    }

    // Load transactions and seed if necessary
    const storedTransactions = localStorage.getItem('userBankingTransactions');
    const transactionsSeeded = localStorage.getItem('bankingTransactionsSeeded');

    if (storedTransactions && storedTransactions !== '[]') {
      console.log('[BankingManager] Loading existing banking transactions from localStorage.');
      try {
        setBankingTransactions(JSON.parse(storedTransactions));
      } catch (e) {
        console.error("Error parsing stored banking transactions:", e);
      }
    } else if (!transactionsSeeded && currentAccounts.length > 0) {
      console.log('[BankingManager] No existing transactions, attempting to seed from mockPlaid.json.');
      const seededTransactions: BankingTransaction[] = [];
      const accountNameToIdMap: Record<string, string | undefined> = {
        checking: currentAccounts.find(acc => acc.name === 'BoA Checking')?.id,
        savings: currentAccounts.find(acc => acc.name === 'BoA Savings')?.id,
        credit: currentAccounts.find(acc => acc.name === 'Chase Credit Card')?.id, // Default to Chase for "credit"
      };

      mockPlaidData.transactions.forEach(mockTx => {
        const targetAccountId = accountNameToIdMap[mockTx.account.toLowerCase()];
        if (targetAccountId) {
          const newTx: BankingTransaction = {
            id: uuidv4(), // Generate new ID
            accountId: targetAccountId,
            date: mockTx.date,
            description: mockTx.name,
            amount: Math.abs(mockTx.amount),
            type: mockTx.amount < 0 ? BankingTransactionType.DEBIT : BankingTransactionType.CREDIT,
            category: mockTx.category,
          };
          seededTransactions.push(newTx);
        } else {
          console.warn(`[BankingManager] Could not find matching account for mock transaction with account type: ${mockTx.account}`);
        }
      });
      
      // Calculate initial balances based on these seeded transactions before setting them
      // This is important because addBankingTransaction below would double-dip on balance calculation if we set transactions first then add them again.
      let accountsWithSeededBalances = [...currentAccounts];
      seededTransactions.forEach(tx => {
        accountsWithSeededBalances = accountsWithSeededBalances.map(acc => {
            if (acc.id === tx.accountId) {
                let newBalance = acc.currentBalance;
                if (acc.type === BankAccountType.CREDIT_CARD) {
                    newBalance += (tx.type === BankingTransactionType.CREDIT ? -tx.amount : tx.amount);
                } else {
                    newBalance += (tx.type === BankingTransactionType.CREDIT ? tx.amount : -tx.amount);
                }
                return { ...acc, currentBalance: newBalance };
            }
            return acc;
        });
      });
      
      setBankAccounts(accountsWithSeededBalances); // Set accounts with updated balances from seed
      setBankingTransactions(seededTransactions); // Set the seeded transactions
      localStorage.setItem('userBankingTransactions', JSON.stringify(seededTransactions));
      localStorage.setItem('bankingTransactionsSeeded', 'true');
      console.log(`[BankingManager] Seeded ${seededTransactions.length} transactions.`);
    } else if (transactionsSeeded) {
        console.log('[BankingManager] Banking transactions already seeded, not re-seeding.');
    }

    setIsLoadingBankingData(false);
  }, []); // Runs once on mount

  // Save bank accounts to localStorage
  useEffect(() => {
    if (!isLoadingBankingData) {
      localStorage.setItem('userBankAccounts', JSON.stringify(bankAccounts));
    }
  }, [bankAccounts, isLoadingBankingData]);

  // Save banking transactions to localStorage
  useEffect(() => {
    if (!isLoadingBankingData) {
      localStorage.setItem('userBankingTransactions', JSON.stringify(bankingTransactions));
    }
  }, [bankingTransactions, isLoadingBankingData]);
  
  // --- Account Management ---
  const addBankAccount = useCallback((accountData: Omit<BankAccount, 'id' | 'currentBalance'> & { initialBalance?: number }) => {
    const newAccount: BankAccount = {
      ...accountData,
      id: uuidv4(),
      currentBalance: accountData.initialBalance || 0,
    };
    setBankAccounts(prev => [...prev, newAccount]);
  }, []);

  const removeBankAccount = useCallback((accountId: string) => {
    // Also remove associated transactions
    setBankAccounts(prev => prev.filter(acc => acc.id !== accountId));
    setBankingTransactions(prev => prev.filter(tx => tx.accountId !== accountId));
  }, []);

  // --- Transaction Management ---
  const addBankingTransaction = useCallback((transactionData: Omit<BankingTransaction, 'id'>) => {
    const newTransaction: BankingTransaction = { ...transactionData, id: uuidv4() };
    setBankingTransactions(prev => [...prev, newTransaction]);

    // Update account balance
    setBankAccounts(prevAccounts => 
      prevAccounts.map(acc => {
        if (acc.id === newTransaction.accountId) {
          let newBalance = acc.currentBalance;
          if (acc.type === BankAccountType.CREDIT_CARD) {
            // For credit cards, CREDITS decrease balance owed, DEBITS increase balance owed
            newBalance += (newTransaction.type === BankingTransactionType.CREDIT ? -newTransaction.amount : newTransaction.amount);
          } else { // Checking or Savings
            // For debit accounts, CREDITS increase balance, DEBITS decrease balance
            newBalance += (newTransaction.type === BankingTransactionType.CREDIT ? newTransaction.amount : -newTransaction.amount);
          }
          return { ...acc, currentBalance: newBalance };
        }
        return acc;
      })
    );
  }, []);

  const removeBankingTransaction = useCallback((transactionId: string) => {
    const transactionToRemove = bankingTransactions.find(tx => tx.id === transactionId);
    if (!transactionToRemove) return;

    setBankingTransactions(prev => prev.filter(tx => tx.id !== transactionId));

    // Revert balance change on the account
    setBankAccounts(prevAccounts => 
      prevAccounts.map(acc => {
        if (acc.id === transactionToRemove.accountId) {
          let newBalance = acc.currentBalance;
           if (acc.type === BankAccountType.CREDIT_CARD) {
            // Reverse of add: CREDITs increased balance (less owed), DEBITs decreased (more owed)
            newBalance -= (transactionToRemove.type === BankingTransactionType.CREDIT ? -transactionToRemove.amount : transactionToRemove.amount);
          } else { // Checking or Savings
            // Reverse of add: CREDITs decreased balance, DEBITs increased balance
            newBalance -= (transactionToRemove.type === BankingTransactionType.CREDIT ? transactionToRemove.amount : -transactionToRemove.amount);
          }
          return { ...acc, currentBalance: newBalance };
        }
        return acc;
      })
    );
  }, [bankingTransactions]);

  // --- Balance Calculation ---
  // This function is somewhat redundant if currentBalance is kept up-to-date on BankAccount object.
  // However, it can serve as a way to recalculate or verify if needed.
  // For now, direct currentBalance updates are implemented in add/remove transaction.
  const getAccountBalance = useCallback((accountId: string): number => {
    const account = bankAccounts.find(acc => acc.id === accountId);
    if (!account) return 0;
    // This could be a more complex calculation from an initial balance + all transactions if we didn't store currentBalance directly.
    // But since we do, we can just return it.
    return account.currentBalance;
  }, [bankAccounts]);


  return {
    bankAccounts,
    bankingTransactions,
    isLoadingBankingData,
    addBankAccount,
    removeBankAccount,
    addBankingTransaction,
    removeBankingTransaction,
    getAccountBalance,
  };
} 