'use client';

import React, { useState } from 'react';
import {
  useBankingManager,
  BankAccount,
  BankingTransaction,
  BankAccountType,
  BankingTransactionType
} from '@/hooks/useBankingManager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon, PlusCircleIcon, Trash2Icon, EditIcon } from 'lucide-react'; // Added EditIcon
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

const formatCurrency = (value: number | undefined) => {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

export default function BankingPage() {
  const {
    bankAccounts,
    bankingTransactions,
    isLoadingBankingData,
    addBankAccount,
    removeBankAccount,
    addBankingTransaction,
    removeBankingTransaction,
    getAccountBalance,
  } = useBankingManager();

  // Calculate total inflows, outflows, and net flow
  let totalInflow = 0;
  let totalOutflow = 0;
  bankingTransactions.forEach(tx => {
    if (tx.type === BankingTransactionType.CREDIT) {
      totalInflow += tx.amount;
    } else {
      totalOutflow += tx.amount;
    }
  });
  const netFlow = totalInflow - totalOutflow;

  // State for Add/Edit Account Dialog
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<BankAccountType>(BankAccountType.CHECKING);
  const [initialBalance, setInitialBalance] = useState<number | ''>('');
  const [institution, setInstitution] = useState('');

  // State for Add Transaction Dialog
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [transactionAccountId, setTransactionAccountId] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<Date | undefined>(new Date());
  const [transactionDescription, setTransactionDescription] = useState('');
  const [transactionAmount, setTransactionAmount] = useState<number | ''>('');
  const [transactionType, setTransactionType] = useState<BankingTransactionType>(BankingTransactionType.DEBIT);
  const [transactionCategory, setTransactionCategory] = useState('');

  const handleOpenAddAccountDialog = () => {
    setEditingAccount(null);
    setAccountName('');
    setAccountType(BankAccountType.CHECKING);
    setInitialBalance(0);
    setInstitution('');
    setIsAccountDialogOpen(true);
  };

  // TODO: handleOpenEditAccountDialog(account: BankAccount)

  const handleSaveAccount = () => {
    if (!accountName || !accountType) {
      alert('Account Name and Type are required.');
      return;
    }
    // For now, only adding new accounts. Edit functionality can be added.
    addBankAccount({
      name: accountName,
      type: accountType,
      initialBalance: Number(initialBalance || 0),
      institution: institution || undefined,
    });
    setIsAccountDialogOpen(false);
  };

  const handleOpenAddTransactionDialog = (accountId?: string) => {
    setTransactionAccountId(accountId || (bankAccounts[0]?.id || ''));
    setTransactionDate(new Date());
    setTransactionDescription('');
    setTransactionAmount('');
    setTransactionType(BankingTransactionType.DEBIT);
    setTransactionCategory('');
    setIsTransactionDialogOpen(true);
  };

  const handleSaveTransaction = () => {
    if (!transactionAccountId || !transactionDate || !transactionDescription || transactionAmount === '') {
      alert('All transaction fields are required.');
      return;
    }
    addBankingTransaction({
      accountId: transactionAccountId,
      date: format(transactionDate, 'yyyy-MM-dd'),
      description: transactionDescription,
      amount: Number(transactionAmount),
      type: transactionType,
      category: transactionCategory || undefined,
    });
    setIsTransactionDialogOpen(false);
  };

  if (isLoadingBankingData) {
    return <p className="p-4 text-center">Loading banking data...</p>;
  }

  return (
    <div className="space-y-8">
      {/* Balance Sheet Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Banking Flow Summary</CardTitle>
          <CardDescription>Overall inflows, outflows, and net flow from your banking transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left">
            <div>
              <p className="text-sm text-muted-foreground">Total Inflow</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalInflow)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Outflow</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOutflow)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Flow</p>
              <p className={`text-2xl font-bold ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netFlow)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Management Buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Bank Accounts</h2>
        <div className="space-x-2">
            <Button onClick={handleOpenAddAccountDialog}><PlusCircleIcon className="mr-2 h-4 w-4" /> Add Account</Button>
            <Button onClick={() => handleOpenAddTransactionDialog()} variant="outline"><PlusCircleIcon className="mr-2 h-4 w-4" /> Add Transaction</Button>
        </div>
      </div>

      {/* Accounts Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bankAccounts.map((account) => {
          const accountTransactions = bankingTransactions
            .filter(tx => tx.accountId === account.id)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          return (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{account.name}</CardTitle>
                  {/* <Button variant="ghost" size="sm" onClick={() => handleOpenEditAccountDialog(account)}><EditIcon className="h-4 w-4"/></Button> */}
                </div>
                <CardDescription>{account.type} ({account.institution || 'N/A'})</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(getAccountBalance(account.id))}</p>
                </div>
                {account.type !== BankAccountType.CREDIT_CARD && account.isPrimaryPaycheckAccount && <p className="text-xs text-green-600">Paychecks deposited here</p>}
                {account.type === BankAccountType.CREDIT_CARD && account.isPrimaryRentAccount && <p className="text-xs text-blue-600">Rent paid with this card</p>}
                
                {accountTransactions.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-sm font-medium mb-1 text-muted-foreground">Recent Activity:</h4>
                    <ul className="space-y-1 max-h-32 overflow-y-auto pr-1 text-xs">
                      {accountTransactions.slice(0, 5).map(tx => (
                        <li key={tx.id} className="flex justify-between items-center">
                          <span>{tx.description} <span className="text-muted-foreground">({format(new Date(tx.date + 'T00:00:00'), 'MM/dd')})</span></span>
                          <span className={`font-medium ${tx.type === BankingTransactionType.DEBIT ? (account?.type === BankAccountType.CREDIT_CARD ? 'text-red-500' : 'text-red-500') : 'text-green-500'}`}>
                            {tx.type === BankingTransactionType.DEBIT ? '-' : '+'}{formatCurrency(tx.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {accountTransactions.length > 5 && <p className="text-xs text-muted-foreground text-center mt-1">...</p>}
                  </div>
                )}
                {accountTransactions.length === 0 && <p className="text-xs text-muted-foreground pt-2">No recent activity for this account.</p>}

                <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => handleOpenAddTransactionDialog(account.id)}>Add Transaction to this Account</Button>
              </CardContent>
            </Card>
          );
        })}
        {bankAccounts.length === 0 && <p>No bank accounts added yet.</p>}
      </div>

      {/* Recent Transactions Display (Placeholder) */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-3">Recent Banking Transactions</h2>
        {bankingTransactions.length === 0 && <p>No banking transactions recorded yet.</p>}
        {bankingTransactions.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <ul className="space-y-2">
                {bankingTransactions.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0,10).map(tx => {
                  const account = bankAccounts.find(acc => acc.id === tx.accountId);
                  return (
                    <li key={tx.id} className="flex justify-between items-center p-2 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{tx.description} <span className="text-xs text-muted-foreground">({account?.name})</span></p>
                        <p className="text-xs text-muted-foreground">{format(new Date(tx.date + 'T00:00:00'), 'MMM dd, yyyy')} {tx.category && `- ${tx.category}`}</p>
                      </div>
                      <div className={`font-medium ${tx.type === BankingTransactionType.DEBIT ? (account?.type === BankAccountType.CREDIT_CARD ? 'text-red-600' : 'text-red-600') : 'text-green-600'}`}>
                        {tx.type === BankingTransactionType.DEBIT ? '-' : '+'}{formatCurrency(tx.amount)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Account Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit' : 'Add New'} Bank Account</DialogTitle>
            <DialogDescription>
              {editingAccount ? 'Update details for your bank account.' : 'Add a new checking, savings, or credit card account.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input placeholder="Account Name (e.g., BoA Checking)" value={accountName} onChange={e => setAccountName(e.target.value)} />
            <Select value={accountType} onValueChange={(value: BankAccountType) => setAccountType(value)}>
              <SelectTrigger><SelectValue placeholder="Account Type" /></SelectTrigger>
              <SelectContent>
                {Object.values(BankAccountType).map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Current Balance (e.g., 1500.00)" value={initialBalance} onChange={e => setInitialBalance(e.target.value === '' ? '' : parseFloat(e.target.value))} />
            <Input placeholder="Institution (e.g., Bank of America)" value={institution} onChange={e => setInstitution(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccountDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAccount}>Save Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Banking Transaction</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select value={transactionAccountId} onValueChange={setTransactionAccountId} disabled={!bankAccounts.length}>
              <SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger>
              <SelectContent>
                {bankAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!transactionDate && "text-muted-foreground"}`}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {transactionDate ? format(transactionDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={transactionDate} onSelect={setTransactionDate} initialFocus /></PopoverContent>
            </Popover>
            <Input placeholder="Description (e.g., Salary, Rent)" value={transactionDescription} onChange={e => setTransactionDescription(e.target.value)} />
            <Input type="number" placeholder="Amount" value={transactionAmount} onChange={e => setTransactionAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} />
            <Select value={transactionType} onValueChange={(value: BankingTransactionType) => setTransactionType(value)}>
              <SelectTrigger><SelectValue placeholder="Transaction Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={BankingTransactionType.DEBIT}>Debit / Expense / Charge</SelectItem>
                <SelectItem value={BankingTransactionType.CREDIT}>Credit / Income / Payment</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Category (Optional, e.g., Food, Utilities)" value={transactionCategory} onChange={e => setTransactionCategory(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTransaction}>Save Transaction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
} 