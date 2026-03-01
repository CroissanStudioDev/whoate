import type { Debt, DebtSummary, Participant, Receipt, Session } from "@/types";

interface ParticipantBalance {
  participantId: string;
  balance: number; // positive = owed money, negative = owes money
}

/**
 * Calculate what each participant owes for a single receipt
 */
function calculateReceiptShares(
  receipt: Receipt,
  participants: Participant[]
): Map<string, number> {
  const shares = new Map<string, number>();

  // Initialize all participants with 0
  for (const p of participants) {
    shares.set(p.id, 0);
  }

  // Calculate base item costs per participant
  let totalClaimedAmount = 0;

  receipt.items.forEach((item) => {
    if (item.claims.length === 0) return;

    // Calculate how to split this item
    const individualClaims = item.claims.filter((c) => c.type === "individual");
    const sharedClaims = item.claims.filter((c) => c.type === "shared");

    if (individualClaims.length > 0) {
      // Split among individual claimants
      const perPerson = item.totalPrice / individualClaims.length;
      individualClaims.forEach((claim) => {
        const current = shares.get(claim.participantId) || 0;
        shares.set(claim.participantId, current + perPerson);
        totalClaimedAmount += perPerson;
      });
    }

    if (sharedClaims.length > 0) {
      // For shared items, split among specified participants
      sharedClaims.forEach((claim) => {
        const shareParticipants = claim.sharedWith || participants.map((p) => p.id);
        const perPerson = item.totalPrice / shareParticipants.length;
        shareParticipants.forEach((pid) => {
          const current = shares.get(pid) || 0;
          shares.set(pid, current + perPerson);
        });
        totalClaimedAmount += item.totalPrice;
      });
    }
  });

  // Distribute tax and tip proportionally based on each person's subtotal
  const taxAndTip = (receipt.tax || 0) + (receipt.tip || 0);
  if (taxAndTip > 0 && totalClaimedAmount > 0) {
    shares.forEach((amount, participantId) => {
      if (amount > 0) {
        const proportion = amount / totalClaimedAmount;
        const extra = taxAndTip * proportion;
        shares.set(participantId, amount + extra);
      }
    });
  }

  return shares;
}

/**
 * Simplify debts to minimize number of transactions
 * Uses a greedy algorithm to settle debts
 */
function simplifyDebts(balances: ParticipantBalance[]): Debt[] {
  const debts: Debt[] = [];

  // Separate into creditors (positive balance) and debtors (negative balance)
  const creditors = balances.filter((b) => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
  const debtors = balances.filter((b) => b.balance < -0.01).sort((a, b) => a.balance - b.balance);

  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const amount = Math.min(creditor.balance, -debtor.balance);

    if (amount > 0.01) {
      debts.push({
        from: debtor.participantId,
        to: creditor.participantId,
        amount: Math.round(amount * 100) / 100,
      });
    }

    creditor.balance -= amount;
    debtor.balance += amount;

    if (creditor.balance < 0.01) i++;
    if (debtor.balance > -0.01) j++;
  }

  return debts;
}

/**
 * Calculate all debts for a session, grouped by currency
 */
export function calculateDebts(session: Session): DebtSummary[] {
  const summaries: DebtSummary[] = [];

  // Group receipts by currency
  const receiptsByCurrency = new Map<string, Receipt[]>();
  session.receipts.forEach((receipt) => {
    const existing = receiptsByCurrency.get(receipt.currency) || [];
    existing.push(receipt);
    receiptsByCurrency.set(receipt.currency, existing);
  });

  // Process each currency
  receiptsByCurrency.forEach((receipts, currency) => {
    // Calculate net balance for each participant
    // Positive = they are owed money, Negative = they owe money
    const balances = new Map<string, number>();

    // Initialize all participants
    for (const p of session.participants) {
      balances.set(p.id, 0);
    }

    receipts.forEach((receipt) => {
      // The payer starts with positive balance (they paid)
      const payerBalance = balances.get(receipt.paidBy) || 0;
      balances.set(receipt.paidBy, payerBalance + receipt.total);

      // Each participant's share is subtracted from their balance
      const shares = calculateReceiptShares(receipt, session.participants);
      shares.forEach((amount, participantId) => {
        const current = balances.get(participantId) || 0;
        balances.set(participantId, current - amount);
      });
    });

    // Convert to array format
    const balanceArray: ParticipantBalance[] = [];
    balances.forEach((balance, participantId) => {
      balanceArray.push({ participantId, balance });
    });

    // Simplify debts
    const debts = simplifyDebts(balanceArray);
    const originalDebtCount = (session.participants.length * (session.participants.length - 1)) / 2;

    summaries.push({
      currency,
      debts,
      optimized: debts.length < originalDebtCount && debts.length > 0,
    });
  });

  return summaries;
}

/**
 * Format debts as shareable text
 */
export function formatDebtsAsText(summaries: DebtSummary[], participants: Participant[]): string {
  const lines: string[] = ["💰 WhoAte - Bill Split Results", ""];

  const getName = (id: string) => participants.find((p) => p.id === id)?.name || "Unknown";

  summaries.forEach((summary) => {
    if (summary.debts.length === 0) {
      lines.push(`${summary.currency}: All settled! ✅`);
      return;
    }

    lines.push(`${summary.currency}:`);
    summary.debts.forEach((debt) => {
      lines.push(`  ${getName(debt.from)} → ${getName(debt.to)}: ${debt.amount.toFixed(2)}`);
    });
    lines.push("");
  });

  if (summaries.some((s) => s.optimized)) {
    lines.push("✨ Transactions optimized for fewer transfers");
  }

  return lines.join("\n");
}
