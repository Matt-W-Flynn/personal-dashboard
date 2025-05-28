'use client';

import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { CalendarIcon, UploadCloudIcon, Edit3Icon, Trash2Icon, RotateCcwIcon, PlusCircleIcon, ChevronsUpDownIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { usePortfolioManager, Transaction, Holding } from '@/hooks/usePortfolioManager';

// Type for CSV row for clarity
interface RobinhoodCSVRow {
  'Activity Date': string;
  'Process Date': string;
  'Settle Date': string;
  Instrument: string;
  Description: string;
  'Trans Code': string;
  Quantity: string;
  Price: string;
  Amount: string;
}

interface TransactionManagerProps {
  // onPortfolioUpdate is no longer needed as the hook manages the portfolio state internally
  // and other components (like FinancialSummaryPage) will also use the hook.
}

const TransactionManager: React.FC<TransactionManagerProps> = () => {
  const {
    transactions,
    portfolio,
    manualAdjustments,
    isLoadingPortfolio,
    addTransaction,
    removeTransaction,
    loadTransactionsFromCSV,
    addManualAdjustment,
    removeManualAdjustment,
  } = usePortfolioManager();

  // Form state for transactions
  const [transactionType, setTransactionType] = useState<'BUY' | 'SELL'>('BUY');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvImportError, setCsvImportError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Form state for manual adjustments
  const [editingManualSymbol, setEditingManualSymbol] = useState<string | null>(null);
  const [manualSymbol, setManualSymbol] = useState('');
  const [manualQuantity, setManualQuantity] = useState<number | ''>('');
  const [manualAverageCost, setManualAverageCost] = useState<number | ''>('');
  
  const [activeAccordionItems, setActiveAccordionItems] = useState<string[]>(['item-2']);

  const handleAddTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || quantity === '' || price === '' || !date) {
      alert('Please fill in all transaction fields.');
      return;
    }
    addTransaction({
      type: transactionType,
      symbol: symbol.toUpperCase(),
      quantity: Number(quantity),
      price: Number(price),
      date: format(date, 'yyyy-MM-dd'),
    });
    // Reset form
    setSymbol('');
    setQuantity('');
    setPrice('');
    setDate(new Date());
    setTransactionType('BUY');
    setActiveAccordionItems([]); // Close current accordion, open history
    setShowHistory(true);
  };

  const handleCsvImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvImportError(null);

    Papa.parse<RobinhoodCSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const importedTransactions: Omit<Transaction, 'id'>[] = [];
        const errors: string[] = [];

        results.data.forEach((row, index) => {
          const instrument = row.Instrument?.trim();
          if (!instrument || instrument === 'EGIO') return; // Skip EGIO or empty symbols

          const transCode = row['Trans Code']?.trim();
          let type: 'BUY' | 'SELL' | undefined = undefined;
          if (transCode === 'BUY' || transCode === 'BTO') type = 'BUY';
          else if (transCode === 'SLD' || transCode === 'STC') type = 'SELL'; // Assuming SLD/STC for sell
          // Add more mappings if necessary for other trans codes

          if (!type) return; // Skip if not a buy or sell type we handle

          const activityDateStr = row['Activity Date']?.trim();
          const qtyStr = row.Quantity?.trim();
          const priceStr = row.Price?.trim().replace(/[^\\d.-]/g, ''); // Remove non-numeric like '$'

          if (!activityDateStr || !qtyStr || !priceStr ) {
            errors.push(`Row ${index + 2}: Missing required fields (Date, Quantity, or Price).`);
            return;
          }
          
          const parsedDate = parse(activityDateStr, 'MM/dd/yyyy', new Date());
          if (!isValid(parsedDate)) {
            errors.push(`Row ${index + 2}: Invalid date format for ${instrument}. Expected MM/DD/YYYY.`);
            return;
          }

          const numQuantity = parseFloat(qtyStr);
          const numPrice = parseFloat(priceStr);

          if (isNaN(numQuantity) || isNaN(numPrice) || numQuantity <= 0 || numPrice <= 0) {
            errors.push(`Row ${index + 2}: Invalid quantity or price for ${instrument}.`);
            return;
          }

          importedTransactions.push({
            symbol: instrument.toUpperCase(),
            type: type,
            quantity: numQuantity,
            price: numPrice,
            date: format(parsedDate, 'yyyy-MM-dd'),
          });
        });

        if (errors.length > 0) {
          setCsvImportError(`Import errors:\n${errors.join('\n')}`);
          return;
        }
        
        if (importedTransactions.length === 0) {
          setCsvImportError('No valid buy or sell transaction data found in the file. Check symbol and Trans Code columns.');
          return;
        }

        // For simplicity, always appending. Could add a confirm dialog for replacing.
        // const replace = confirm('Replace existing transactions or append? (OK to replace, Cancel to append)');
        loadTransactionsFromCSV(importedTransactions, false); // false for append
        alert(`Successfully imported ${importedTransactions.length} transactions!`);
        setActiveAccordionItems([]); // Close import accordion
        setShowHistory(true); // Open history accordion
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        setCsvImportError(`CSV parsing error: ${error.message}`);
      },
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
  };
  
  const handleSaveManualAdjustment = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!manualSymbol || manualQuantity === '' || manualAverageCost === '') {
        alert('Please fill in all fields for manual adjustment.');
        return;
    }
    addManualAdjustment(manualSymbol.toUpperCase(), {
        type: 'OVERRIDE',
        quantity: Number(manualQuantity),
        averageCost: Number(manualAverageCost),
    });
    setEditingManualSymbol(null); // Exit editing mode
    setManualSymbol('');
    setManualQuantity('');
    setManualAverageCost('');
    setActiveAccordionItems(['item-4']); // Keep manual adjustments open
  };

  const handleEditManualAdjustment = (holding: Holding) => {
    setEditingManualSymbol(holding.symbol);
    setManualSymbol(holding.symbol);
    setManualQuantity(holding.quantity);
    setManualAverageCost(holding.averageCost);
    setActiveAccordionItems(['item-4']); // Ensure it's open
  };

  const handleCancelEditManual = () => {
    setEditingManualSymbol(null);
    setManualSymbol('');
    setManualQuantity('');
    setManualAverageCost('');
  };

  const handleRemoveHoldingView = (symbolToRemove: string) => {
    if (confirm(`Are you sure you want to hide ${symbolToRemove} from your portfolio? This will mark it as removed.`)) {
        addManualAdjustment(symbolToRemove.toUpperCase(), { type: 'REMOVED' });
        setActiveAccordionItems(['item-4']);
    }
  };

  const handleRevertManualAdjustment = (symbolToRevert: string) => {
    if (confirm(`Revert ${symbolToRevert} to be calculated from transactions? Any manual override will be removed.`)) {
        removeManualAdjustment(symbolToRevert.toUpperCase());
        setActiveAccordionItems(['item-4']);
    }
  };

  // Effect to control accordion based on history visibility or editing
  useEffect(() => {
    if (showHistory) {
      setActiveAccordionItems(['item-3']);
      setShowHistory(false); // Reset trigger
    } else if (editingManualSymbol) {
      setActiveAccordionItems(['item-4', 'sub-item-manual-add']);
    } else if (activeAccordionItems.length === 0 && !isLoadingPortfolio) { 
      // If nothing is open and not loading, default to add transaction
      // This prevents accordion from closing completely after an action like import
      // unless another section was explicitly opened (e.g., manual adjustments)
       if (!activeAccordionItems.includes('item-4')) {
         // setActiveAccordionItems(['item-2']);
       }     
    }
  }, [showHistory, editingManualSymbol, activeAccordionItems, isLoadingPortfolio]);

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Manage Your Portfolio</CardTitle>
        <CardDescription className="text-center">
          Import historical trades, add new transactions, or make manual adjustments to your holdings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" value={activeAccordionItems} onValueChange={setActiveAccordionItems} className="w-full">
          {/* AccordionItem 1: CSV Import */}
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-lg">
                <UploadCloudIcon className="w-5 h-5 mr-2" /> Import Transactions from CSV
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                    Upload a CSV file with your transaction history. Supported columns: 'Activity Date' (MM/DD/YYYY), 'Trans Code' (BUY, BTO, SLD, STC), 'Instrument' (Ticker), 'Quantity', 'Price'. 
                    Rows with symbol 'EGIO' will be skipped.
                </p>
                <Input type="file" accept=".csv" onChange={handleCsvImport} ref={fileInputRef} className="file:mr-2 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                {csvImportError && <p className="text-sm text-red-500">{csvImportError}</p>}
            </AccordionContent>
          </AccordionItem>

          {/* AccordionItem 2: Add Transaction Form */}
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-lg">
                <PlusCircleIcon className="w-5 h-5 mr-2" /> Add New Transaction
            </AccordionTrigger>
            <AccordionContent className="pt-4">
                <form onSubmit={handleAddTransactionSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Select value={transactionType} onValueChange={(value: 'BUY' | 'SELL') => setTransactionType(value)}>
                            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BUY">Buy</SelectItem>
                                <SelectItem value="SELL">Sell</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input placeholder="Symbol (e.g., AAPL)" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} required />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <Input type="number" placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))} min="0" step="any" required />
                        <Input type="number" placeholder="Price per Share" value={price} onChange={e => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))} min="0" step="any" required />
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Button type="submit" className="w-full">Add Transaction</Button>
                </form>
            </AccordionContent>
          </AccordionItem>

          {/* AccordionItem 3: Transaction History */}
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-lg">Transaction History ({transactions.length})</AccordionTrigger>
            <AccordionContent className="pt-2">
                {transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No transactions yet.</p>
                ) : (
                    <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                        {transactions.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
                            <div key={tx.id} className="flex justify-between items-center p-3 bg-muted/20 rounded-md text-sm">
                                <div>
                                    <span className={`font-semibold ${tx.type === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>{tx.type} {tx.symbol}</span>
                                    <span className="text-muted-foreground ml-2">{tx.quantity} @ ${tx.price.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center">
                                   <span className="text-muted-foreground mr-3">{format(new Date(tx.date + 'T00:00:00'), 'MM/dd/yyyy')}</span>
                                   <Button variant="ghost" size="sm" onClick={() => removeTransaction(tx.id)}><Trash2Icon className="w-4 h-4 text-red-500"/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </AccordionContent>
          </AccordionItem>

           {/* AccordionItem 4: Manual Portfolio Adjustments */}
           <AccordionItem value="item-4">
                <AccordionTrigger className="text-lg">
                    <ChevronsUpDownIcon className="w-5 h-5 mr-2" /> Manual Portfolio Adjustments
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Override calculated positions or mark a holding as removed. Useful for transfers or if calculations don't match brokerage exactly.
                    </p>
                    
                    <Accordion type="single" collapsible className="w-full" value={editingManualSymbol ? 'sub-item-manual-add' : undefined}>
                        <AccordionItem value="sub-item-manual-add">
                            <AccordionTrigger onClick={() => {
                                if (editingManualSymbol) setEditingManualSymbol(null); // Toggle off if clicking header while editing
                                else setActiveAccordionItems(prev => prev.includes('sub-item-manual-add') ? prev.filter(i=>i!=='sub-item-manual-add') : [...prev, 'sub-item-manual-add'] );
                            }} className="text-md">
                                {editingManualSymbol ? `Editing ${editingManualSymbol}` : 'Add/Override Holding'}
                            </AccordionTrigger>
                            <AccordionContent className="pt-3">
                                <form onSubmit={handleSaveManualAdjustment} className="space-y-3 p-1 bg-muted/20 rounded-md">
                                    <Input 
                                        placeholder="Symbol (e.g., AAPL)" 
                                        value={manualSymbol} 
                                        onChange={e => setManualSymbol(e.target.value.toUpperCase())} 
                                        required 
                                        disabled={!!editingManualSymbol} // Disable if editing an existing symbol
                                        className={!!editingManualSymbol ? "bg-gray-100 dark:bg-gray-700" : ""}
                                    />
                                    <Input 
                                        type="number" 
                                        placeholder="Quantity" 
                                        value={manualQuantity} 
                                        onChange={e => setManualQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                                        min="0" step="any" 
                                        required 
                                    />
                                    <Input 
                                        type="number" 
                                        placeholder="Average Cost Per Share" 
                                        value={manualAverageCost} 
                                        onChange={e => setManualAverageCost(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                                        min="0" step="any" 
                                        required 
                                    />
                                    <div className="flex gap-2">
                                        <Button type="submit" className="flex-grow">{editingManualSymbol ? 'Update Adjustment' : 'Save Adjustment'}</Button>
                                        {editingManualSymbol && <Button type="button" variant="outline" onClick={handleCancelEditManual}>Cancel</Button>}
                                    </div>
                                </form>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <h4 className="text-md font-semibold pt-3">Current Manually Adjusted Holdings:</h4>
                    {Object.keys(manualAdjustments).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-3">No manual adjustments applied.</p>
                    ) : (
                        <div className="space-y-2">
                            {Object.entries(manualAdjustments).map(([sym, adj]) => (
                                <div key={sym} className="flex justify-between items-center p-3 bg-muted/20 rounded-md text-sm">
                                    <div>
                                        <span className="font-semibold">{sym}</span>: 
                                        {adj.type === 'REMOVED' ? (
                                            <span className="italic text-orange-500 ml-1">Marked as Removed</span>
                                        ) : (
                                            <span className="ml-1">{adj.quantity} shares @ ${adj.averageCost.toFixed(2)} avg. cost</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {adj.type === 'OVERRIDE' && 
                                            <Button variant="ghost" size="sm" onClick={() => handleEditManualAdjustment({symbol: sym, ...adj, totalCost: adj.quantity * adj.averageCost } as Holding)}>
                                                <Edit3Icon className="w-4 h-4 text-blue-500"/>
                                            </Button>
                                        }
                                        <Button variant="ghost" size="sm" onClick={() => handleRevertManualAdjustment(sym)}>
                                            <RotateCcwIcon className="w-4 h-4 text-gray-500"/>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <h4 className="text-md font-semibold pt-3">Calculated Holdings (before manual adjustments):</h4>
                     {Object.values(portfolio).filter(h => !h.isManuallyAdjusted && !manualAdjustments[h.symbol]).length === 0 && !isLoadingPortfolio && (
                        <p className="text-sm text-muted-foreground text-center py-3">No holdings calculated from transactions or all are manually adjusted.</p>
                     )}
                     {isLoadingPortfolio && <p className="text-sm text-muted-foreground text-center py-3">Loading portfolio...</p>}
                     {!isLoadingPortfolio && Object.values(portfolio).filter(h => !h.isManuallyAdjusted && !manualAdjustments[h.symbol]).map(holding => (
                            <div key={holding.symbol} className="flex justify-between items-center p-3 bg-muted/20 rounded-md text-sm">
                                <div>
                                    <span className="font-semibold">{holding.symbol}</span>
                                    <span className="text-muted-foreground ml-2">{holding.quantity.toFixed(2)} @ ${holding.averageCost.toFixed(2)} avg. cost</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="sm" onClick={() => handleEditManualAdjustment(holding)}>
                                        <Edit3Icon className="w-3 h-3 mr-1" /> Override
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 border-red-500 hover:border-red-600" onClick={() => handleRemoveHoldingView(holding.symbol)}>
                                        <Trash2Icon className="w-3 h-3 mr-1" /> Hide
                                    </Button>
                                </div>
                            </div>
                        ))}
                </AccordionContent>
            </AccordionItem>

        </Accordion>
      </CardContent>
    </Card>
  );
};

export default TransactionManager; 