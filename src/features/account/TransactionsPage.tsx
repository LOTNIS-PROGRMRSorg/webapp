import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { money } from '@/lib/format';
import { TransactionRows } from '@/components/cards/ListingCard';
import type { Transaction } from '@/types';

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    api
      .getTransactions()
      .then(setTransactions)
      .catch((err) => setError(err.message));
  }, []);
  return (
    <section className="section dashboard-page">
      <span className="eyebrow">Your money trail</span>
      <h1>Transactions</h1>
      <p className="lead">Every reservation, Lotnis service fee, and payment reference in one place.</p>
      {error ? <div className="error-state">{error}</div> : <TransactionRows transactions={transactions} />}
    </section>
  );
}
