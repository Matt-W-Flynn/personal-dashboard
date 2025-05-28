'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FinnhubQuote, fetchQuote } from '@/lib/finnhub'; // Assuming fetchQuote is needed here

// Keep original interfaces from TransactionManager
export interface Transaction {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  quantity: number;
  price: number; // Price per share
  date: string; // YYYY-MM-DD
}

export interface Holding {
  symbol: string;
  quantity: number;
  averageCost: number;
  totalCost: number;
  currentPrice?: number;
  marketValue?: number;
  unrealizedPL?: number;
  unrealizedPLPercent?: number;
  isManuallyAdjusted?: boolean;
}

interface PurchaseLot {
  transactionId: string;
  purchaseDate: string;
  pricePerShare: number;
  quantityRemaining: number;
}

interface ManualAdjustment {
  quantity: number;
  averageCost: number;
  type: 'OVERRIDE';
}

interface ManualRemoval {
  type: 'REMOVED';
}

type ManualAdjustmentEntry = ManualAdjustment | ManualRemoval;

export interface PortfolioHookResult {
  transactions: Transaction[];
  portfolio: Record<string, Holding>;
  manualAdjustments: Record<string, ManualAdjustmentEntry>;
  isLoadingPortfolio: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  removeTransaction: (transactionId: string) => void;
  loadTransactionsFromCSV: (parsedData: Omit<Transaction, 'id'>[], replace: boolean) => void;
  addManualAdjustment: (symbol: string, adjustment: ManualAdjustmentEntry) => void;
  removeManualAdjustment: (symbol: string) => void;
  // Add other necessary functions like CSV parsing helpers if they are generic enough
}

export function usePortfolioManager(): PortfolioHookResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [manualAdjustments, setManualAdjustments] = useState<Record<string, ManualAdjustmentEntry>>({});
  const [portfolio, setPortfolio] = useState<Record<string, Holding>>({});
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [isLoadingManualAdjustments, setIsLoadingManualAdjustments] = useState(true);
  const [isFetchingPrices, setIsFetchingPrices] = useState(false);

  // Load transactions from localStorage
  useEffect(() => {
    const storedTransactions = localStorage.getItem('portfolioTransactions');
    if (storedTransactions) {
      try {
        setTransactions(JSON.parse(storedTransactions));
      } catch (e) { console.error("Error parsing transactions:", e); }
    }
    setIsLoadingTransactions(false);
  }, []);

  // Save transactions
  useEffect(() => {
    if (!isLoadingTransactions) {
      localStorage.setItem('portfolioTransactions', JSON.stringify(transactions));
    }
  }, [transactions, isLoadingTransactions]);

  // Load manual adjustments
  useEffect(() => {
    const storedAdjustments = localStorage.getItem('portfolioManualAdjustments');
    if (storedAdjustments) {
      try {
        setManualAdjustments(JSON.parse(storedAdjustments));
      } catch (e) { console.error("Error parsing manual adjustments:", e); }
    }
    setIsLoadingManualAdjustments(false);
  }, []);

  // Save manual adjustments
  useEffect(() => {
    if (!isLoadingManualAdjustments) {
      localStorage.setItem('portfolioManualAdjustments', JSON.stringify(manualAdjustments));
    }
  }, [manualAdjustments, isLoadingManualAdjustments]);

  const calculatePortfolioFromTransactions = useCallback((currentTransactions: Transaction[]): Record<string, Holding> => {
    const activeLotsBySymbol: Record<string, PurchaseLot[]> = {};
    const calculatedPortfolio: Record<string, Holding> = {};
    const sortedTransactions = [...currentTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      if (a.type === 'BUY' && b.type === 'SELL') return -1;
      if (a.type === 'SELL' && b.type === 'BUY') return 1;
      return 0;
    });

    for (const tx of sortedTransactions) {
      const sym = tx.symbol.toUpperCase();
      activeLotsBySymbol[sym] = activeLotsBySymbol[sym] || [];
      if (tx.type === 'BUY') {
        activeLotsBySymbol[sym].push({
          transactionId: tx.id,
          purchaseDate: tx.date,
          pricePerShare: tx.price,
          quantityRemaining: tx.quantity,
        });
        activeLotsBySymbol[sym].sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());
      } else {
        const lotsForSymbol = activeLotsBySymbol[sym];
        if (!lotsForSymbol || lotsForSymbol.length === 0) continue;
        let quantityToSell = tx.quantity;
        for (let i = 0; i < lotsForSymbol.length && quantityToSell > 0; i++) {
          const lot = lotsForSymbol[i];
          const sellableFromLot = Math.min(quantityToSell, lot.quantityRemaining);
          if (sellableFromLot > 0) {
            lot.quantityRemaining -= sellableFromLot;
            quantityToSell -= sellableFromLot;

            // Round to handle potential floating point inaccuracies
            lot.quantityRemaining = parseFloat(lot.quantityRemaining.toFixed(10));
            quantityToSell = parseFloat(quantityToSell.toFixed(10));

            if (lot.quantityRemaining < 1e-9) { // If very close to zero, set to zero
                lot.quantityRemaining = 0;
            }
          }
        }
        activeLotsBySymbol[sym] = lotsForSymbol.filter(lot => lot.quantityRemaining > 1e-9); // Filter out depleted lots, using tolerance
        
        // Check for overselling only if quantityToSell is meaningfully positive
        if (quantityToSell > 1e-9) { 
          console.warn(`Oversold ${sym}: ${quantityToSell} shares could not be sold from lots.`);
          // If oversold, ensure this symbol is treated as having zero quantity from transactions
          // by clearing any remaining lots for this symbol.
          activeLotsBySymbol[sym] = []; 
        }
      }
    }

    for (const sym in activeLotsBySymbol) {
      const finalLotsForSymbol = activeLotsBySymbol[sym];
      if (finalLotsForSymbol.length > 0) {
        let totalQuantity = finalLotsForSymbol.reduce((sum, lot) => sum + lot.quantityRemaining, 0);
        totalQuantity = parseFloat(totalQuantity.toFixed(10)); // Round total quantity

        if (totalQuantity > 1e-9) { // Use tolerance for final quantity check
          const totalCost = finalLotsForSymbol.reduce((sum, lot) => sum + (lot.quantityRemaining * lot.pricePerShare), 0);
          // No need to round totalCost usually as it's currency, but averageCost will use precise totalQuantity
          calculatedPortfolio[sym] = {
            symbol: sym,
            quantity: totalQuantity,
            averageCost: totalCost / totalQuantity, // totalQuantity here is rounded
            totalCost: totalCost,
          };
        }
      }
    }
    return calculatedPortfolio;
  }, []);

  useEffect(() => {
    if (isLoadingTransactions || isLoadingManualAdjustments) return;

    let baseHoldings = calculatePortfolioFromTransactions(transactions);
    let adjustedHoldings = { ...baseHoldings };

    for (const [sym, adjustment] of Object.entries(manualAdjustments)) {
      if (adjustment.type === 'REMOVED') {
        delete adjustedHoldings[sym];
      } else if (adjustment.type === 'OVERRIDE') {
        adjustedHoldings[sym] = {
          ...(adjustedHoldings[sym] || { symbol: sym, totalCost:0 }),
          quantity: adjustment.quantity,
          averageCost: adjustment.averageCost,
          totalCost: adjustment.quantity * adjustment.averageCost,
          isManuallyAdjusted: true,
        };
      }
    }
    
    adjustedHoldings = Object.entries(adjustedHoldings)
      .filter(([_, holding]) => holding.quantity > 0)
      .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
      }, {} as Record<string, Holding>);

    const symbolsToFetch = Object.keys(adjustedHoldings);
    if (symbolsToFetch.length === 0) {
      setPortfolio({});
      setIsFetchingPrices(false);
      return;
    }

    setIsFetchingPrices(true);
    const fetchAllQuotesAndUpdate = async () => {
      const pricedHoldings: Record<string, Holding> = { ...adjustedHoldings };
      try {
        const quotePromises = symbolsToFetch.map(symbol => 
          fetchQuote(symbol)
            .then(quote => ({ symbol, quote, error: null }))
            .catch(error => ({ symbol, error, quote: null }))
        );
        const results = await Promise.all(quotePromises);

        results.forEach(result => {
          const holdingToUpdate = pricedHoldings[result.symbol];
          if (holdingToUpdate) {
            if (result.error) {
              console.warn(`Failed to fetch quote for ${result.symbol}:`, result.error);
            } else if (result.quote) {
              const quoteData = result.quote as FinnhubQuote;
              holdingToUpdate.currentPrice = quoteData.c;
              holdingToUpdate.marketValue = quoteData.c * holdingToUpdate.quantity;
              holdingToUpdate.unrealizedPL = (quoteData.c - holdingToUpdate.averageCost) * holdingToUpdate.quantity;
              if (holdingToUpdate.totalCost > 0) {
                holdingToUpdate.unrealizedPLPercent = (holdingToUpdate.unrealizedPL / holdingToUpdate.totalCost) * 100;
              } else if (holdingToUpdate.marketValue > 0) {
                  holdingToUpdate.unrealizedPLPercent = Infinity;
              } else {
                  holdingToUpdate.unrealizedPLPercent = 0;
              }
            } else {
              console.warn(`No quote data and no error for ${result.symbol} (result.quote is null and result.error is null).`);
            }
          }
        });
        setPortfolio(pricedHoldings);
      } catch (error) {
        console.error("Error fetching quotes for portfolio:", error);
        setPortfolio(adjustedHoldings);
      } finally {
        setIsFetchingPrices(false);
      }
    };

    fetchAllQuotesAndUpdate();
  }, [transactions, manualAdjustments, isLoadingTransactions, isLoadingManualAdjustments, calculatePortfolioFromTransactions]);

  const addTransaction = useCallback((transactionData: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = { ...transactionData, id: uuidv4() };
    setTransactions(prev => [...prev, newTransaction]);
  }, []);

  const removeTransaction = useCallback((transactionId: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== transactionId));
  }, []);

  const loadTransactionsFromCSV = useCallback((parsedData: Omit<Transaction, 'id'>[], replace: boolean) => {
    const newTransactions = parsedData.map(tx => ({ ...tx, id: uuidv4() }));
    if (replace) {
      setTransactions(newTransactions);
    } else {
      setTransactions(prev => [...prev, ...newTransactions]);
    }
  }, []);

  const addManualAdjustment = useCallback((symbol: string, adjustment: ManualAdjustmentEntry) => {
    setManualAdjustments(prev => ({ ...prev, [symbol.toUpperCase()]: adjustment }));
  }, []);

  const removeManualAdjustment = useCallback((symbol: string) => {
    setManualAdjustments(prev => {
      const newState = { ...prev };
      delete newState[symbol.toUpperCase()];
      return newState;
    });
  }, []);

  return {
    transactions,
    portfolio,
    manualAdjustments,
    isLoadingPortfolio: isLoadingTransactions || isLoadingManualAdjustments || isFetchingPrices,
    addTransaction,
    removeTransaction,
    loadTransactionsFromCSV,
    addManualAdjustment,
    removeManualAdjustment,
  };
} 