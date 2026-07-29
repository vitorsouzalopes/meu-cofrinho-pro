# Walkthrough - New Help & Support Page

A dedicated "Ajuda e Suporte" page has been implemented, providing direct contact options via E-mail and WhatsApp with pre-filled messages.

## Changes

### New Support Page
#### [NEW] [Support.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Support.tsx)
- Implemented the layout with:
  - Welcome section.
  - **E-mail section**: Opens the default mail app with recipient `vitorsouzalopes@souunisuam.com.br`, subject "Suporte - Cofrinho Pro", and a structured body.
  - **WhatsApp section**: Opens a chat with `+55 21 97944-9600` and the message "Olá! Preciso de ajuda com o aplicativo Cofrinho Pro."

### Routing and Integration
#### [MODIFY] [App.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/App.tsx)
- Added the `/support` route to the protected layout.

#### [MODIFY] [Profile.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Profile.tsx)
- Updated the "Ajuda e Suporte" menu item to navigate to the new page.
- Removed the legacy help dialog code.

## Verification Results

### Manual Verification
- Navigated to the new support page from the profile.
- Verified that "Enviar E-mail" triggers the correct `mailto:` link.
- Verified that "Conversar no WhatsApp" triggers the correct `wa.me` link.
- Verified the layout matches the requested specifications.
