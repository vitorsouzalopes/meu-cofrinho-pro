# Implementation Plan - New Help & Support Page

This plan describes the creation of a dedicated "Ajuda e Suporte" page with direct contact options via Email and WhatsApp, as requested.

## Proposed Changes

### 1. Support Page
#### [NEW] [Support.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Support.tsx)
- Create a new page component with the following features:
  - Header with a back button.
  - Welcome icon and text.
  - Email section with a "mailto" link including predefined subject and body.
  - WhatsApp section with a direct link to a conversation with a predefined message.
  - Styled with the app's dark theme and glass-morphism cards.

### 2. Routing
#### [MODIFY] [App.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/App.tsx)
- Import the new `Support` page.
- Add a new route `<Route path="/support" element={<Support />} />` inside the `ProtectedLayout`.

### 3. Profile Integration
#### [MODIFY] [Profile.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Profile.tsx)
- Remove the old `helpOpen` state and the Support `Dialog`.
- Update the "Ajuda e Suporte" list item to navigate to `/support` instead of opening the dialog.

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure no syntax errors.

### Manual Verification
- Navigate to **Perfil** > **Ajuda e Suporte**.
- Verify the layout matches the request.
- Test "Enviar E-mail": Check if it opens the mail app with the correct recipient, subject, and body.
- Test "Abrir WhatsApp": Check if it opens WhatsApp with the correct number and message.
- Test "Voltar": Check if it returns to the Profile page.
