# Implementation Plan - Cofrinho Pro v1.0 Backlog

This plan addresses high-priority items from the v1.0 backlog, including Premium features, Goal management improvements, and Dashboard enhancements.

## User Review Required

> [!IMPORTANT]
> Some changes require database schema updates (adding `status` to `goals` and ensuring `is_premium` exists in `profiles`). I will assume these columns are available or can be added.

## Proposed Changes

### 1. Dashboard Enhancements
#### [MODIFY] [Today.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Today.tsx)
- Add "Saúde Financeira" indicator based on income vs. expenses.
  - **Excelente**: Savings > 20% of income.
  - **Atenção**: Expenses between 70% and 90% of income.
  - **Crítica**: Expenses > 90% of income or negative balance.

---

### 2. Goals Management (Edit, Delete, Status)
#### [MODIFY] [Goals.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Goals.tsx)
- Fix state bugs in `resetForm` and `handleEdit` (removed non-existent `setMonthlyAmount`).
- Add confirmation dialog for deletion.
- Add `status` field to Goals (Concluída, Pausada, Cancelada).
- Update UI to show/change status.

---

### 3. AI Consultant Improvements
#### [MODIFY] [AIConsultant.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/AIConsultant.tsx)
- Enhance the "Posso comprar?" response with a structured summary:
  - Purchase amount.
  - Impact % on free money.
  - Remaining balance.
  - Recommendation (e.g., "Wait for next month to save R$ X").
- Ensure it remains locked for non-premium users.

---

### 4. Push Notifications & FCM
#### [MODIFY] [native-push.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/lib/native-push.ts)
- Add more robust logging for FCM registration.
- Verify if the token is being upserted correctly to Supabase.

---

### 5. Premium Features (Reports & Ads)
#### [MODIFY] [Premium.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Premium.tsx)
- Highlight new benefits: No ads, full reports, cloud backup, advanced planning.

---

## Verification Plan

### Automated Tests
- Build and run the app: `npm run build:android`.
- Verify no linting errors.

### Manual Verification
- **Dashboard**: Check if the health indicator changes correctly with different income/expense values.
- **Goals**: Create, edit, and delete a goal. Change its status.
- **AI Consultant**: Ask "Posso comprar um celular de R$ 2000?" and verify the summary.
- **Push**: Check console logs in Android Studio for "Registration success" and token value.
