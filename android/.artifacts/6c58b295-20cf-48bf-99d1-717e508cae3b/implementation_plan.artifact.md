# Implementation Plan - Cofrinho Pro v1.1 Enhancements

This plan addresses AI Consultant improvements, mandatory notification enforcement, and smart notification triggers.

## Proposed Changes

### 1. AI Consultant Improvements
#### [MODIFY] [AIConsultant.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/AIConsultant.tsx)
- **Enhanced Logic:** Implement a keyword-based routing system for the AI bot.
  - **"posso comprar"**: Current impact analysis.
  - **"resumo" / "status"**: Summary of monthly health.
  - **"dicas" / "ajuda"**: Financial saving tips based on current spending ratio.
- **UI Fix:**
  - Fix the input area layout to prevent clipping.
  - Ensure the chat list auto-scrolls correctly and handles mobile keyboard viewports.

### 2. Dashboard Premium Feedback
#### [MODIFY] [Today.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Today.tsx)
- Apply a "Locked" visual style to the AI Consultant card for non-premium users.
- Add a crown icon and a small "Premium" pill to indicate exclusivity.

### 3. Mandatory Notifications & Smart Triggers
#### [MODIFY] [App.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/App.tsx)
- Tighten the `ProtectedLayout` to strictly block access unless notification permission is `granted`.

#### [NEW] [notification-engine.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/lib/notification-engine.ts)
- A helper library to manage local notifications.
- **Upcoming Due Dates:** Schedule warnings 3 days before any account's `due_day`.
- **Goal Deadlines:** Reminders for active goals.
- **Month-End Recap:** Logic to trigger a summary notification on the last day of the month.
  - Checks if everything was paid.
  - Advises on remaining balance.

#### [MODIFY] [Today.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Today.tsx)
- Call the `NotificationEngine` whenever finance data is successfully loaded.

## User Review Required

> [!WARNING]
> Local notifications are scheduled based on the device's clock. If the user changes data frequently, we will need to "cancel all and reschedule" to ensure accuracy.

> [!IMPORTANT]
> The AI Consultant will still use simulated logic (client-side) for now, but with much better context-aware responses.

## Verification Plan

### Automated Tests
- Run `npm run build` to check for syntax errors.

### Manual Verification
- **AI Consultant**: Type non-"posso comprar" messages and verify they get relevant answers.
- **Dashboard**: Check if the IA card is dimmed for free users.
- **Notifications**: Change a bill's due date to "Today + 3 days" and verify if a local notification is scheduled (using logs).
- **Mandatory Flow**: Reinstall the app and verify you cannot enter the dashboard without granting permissions.
