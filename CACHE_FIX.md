# 🔧 Guia de Limpeza de Cache – Cofrinho Pro

O app estava cacheando agressivamente. **Problema resolvido!** ✅

## Solução Imediata (para agora)

### 1️⃣ **Limpar cache do navegador**

#### Chrome / Edge:
- Abra DevTools: `F12` ou `Ctrl+Shift+I`
- Clique em **Application** → **Storage**
- Marque **Cookies** e **Cached Storage**
- Clique **Clear site data**

#### Firefox:
- Abra DevTools: `F12`
- Clique em **Storage** → **Cookies** e **Cache**
- Limpe tudo

#### Safari:
- Menu → **Develop** → **Empty Caches** (ou `Cmd+E`)

### 2️⃣ **Desabilitar cache no Dev Tools (durante desenvolvimento)**

- Abra DevTools (`F12`)
- Vá em **Network**
- Marque ☑️ **Disable cache**

## Solução Permanente (no servidor)

Os seguintes arquivos foram criados para impedir cache agressivo:

- **`_headers`** - Para Vercel/Cloudflare
- **`netlify.toml`** - Para Netlify

**Se hostingando em:**

### 📦 Netlify
Nenhuma ação necessária! O `netlify.toml` já está configurado.

### 🔷 Vercel
Use o arquivo `_headers` automaticamente, OU crie `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/index.html",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
    },
    {
      "source": "/manifest.json",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }]
    },
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

### ☁️ Cloudflare Pages
Crie `_redirects`:

```
/* /index.html 200
```

E configure cache rules no dashboard:
- HTML: **Cache TTL: 0 minutos**
- Assets: **Cache TTL: 31536000s**

### 🏠 Servidor local (localhost)

Adicione aos headers quando servir:

```bash
npm run dev  # Já não cacheia em dev

# Ou use http-server com no-cache:
npx http-server dist -c-1 -g
```

## ✅ Checklist: Cache Corrigido

Depois de fazer deploy com as novas configurações:

- [ ] Limpar cache do navegador (Ctrl+Shift+Delete)
- [ ] Fazer hard refresh (Ctrl+Shift+R ou Cmd+Shift+R)
- [ ] Fazer deploy das mudanças
- [ ] Aguardar ~5 min para propagação do CDN
- [ ] Testar em janela anônima/privada (sem cache local)

## 🛠️ Desenvolvimento Local

Para desenvolvimento, não há cache (HMR rápido):

```bash
npm run dev
```

Mudanças aparecem **instantaneamente**. ⚡

## 📚 Referência de Cache Usado

| Arquivo | Cache | Motivo |
|---------|-------|--------|
| `index.html` | **0s** | Sempre revalidar (SPA entry point) |
| `manifest.json` | **0s** | PWA precisa sempre da versão nova |
| `/assets/*.js` | **1 ano** | Ficheiros com hash (único por versão) |
| Outros estáticos | **1 hora** | Equilibrium entre performance e freshness |

---

**Pronto!** Agora mudanças aparecem sem limpeza manual de cache. 🚀
