import { test, expect } from '@playwright/test';

test.describe('Autenticação e Navegação Básica', () => {
  test('deve carregar a página de login corretamente', async ({ page }) => {
    await page.goto('/auth');

    // Verifica elementos da UI
    await expect(page.locator('h1')).toContainText('Cofrinho PRO');
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('deve alternar entre login e cadastro', async ({ page }) => {
    await page.goto('/auth');

    await page.getByRole('button', { name: 'Criar conta' }).click();
    await expect(page.getByPlaceholder('Seu nome')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Criar Conta' })).toBeVisible();

    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByPlaceholder('Seu nome')).not.toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/auth');

    await page.getByPlaceholder('Email').fill('email_invalido@teste.com');
    await page.getByPlaceholder('Senha').fill('123456');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // O toast de erro deve aparecer (depende da implementação do shadcn/toast)
    // Procuramos por texto de erro comum do Supabase ou o título "Erro"
    await expect(page.getByText('Invalid login credentials')).toBeVisible().catch(() => {
        // Fallback para o título do Toast
        return expect(page.getByText('Erro')).toBeVisible();
    });
  });
});

test.describe('Navegação Protegida', () => {
  test('deve redirecionar para login se não autenticado', async ({ page }) => {
    await page.goto('/');
    // Como a página "/" é protegida, ela deve redirecionar para /auth
    await expect(page).toHaveURL(/.*auth/);
  });
});
