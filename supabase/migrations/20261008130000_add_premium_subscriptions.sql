-- Estrutura de assinatura do Premium.
-- Esta migration prepara o domínio para um provedor de pagamentos.
-- A ativação do Premium continuará dependendo do webhook/serviço confiável;
-- esta tabela, sozinha, não concede acesso.

CREATE TABLE IF NOT EXISTS public.premium_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_customer_id text,
  provider_subscription_id text UNIQUE,
  plan text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'pending',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT premium_subscriptions_status_check
    CHECK (status IN ('pending', 'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete')),
  CONSTRAINT premium_subscriptions_plan_check
    CHECK (plan IN ('monthly', 'yearly'))
);

CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user_id
  ON public.premium_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_provider_subscription_id
  ON public.premium_subscriptions(provider_subscription_id);

ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own premium subscription" ON public.premium_subscriptions;
CREATE POLICY "Users read own premium subscription"
  ON public.premium_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Não há INSERT/UPDATE/DELETE para o cliente.
-- O futuro webhook deverá usar uma função/serviço confiável com privilégios
-- apropriados para atualizar a assinatura.

DROP TRIGGER IF EXISTS set_premium_subscriptions_updated_at ON public.premium_subscriptions;
CREATE TRIGGER set_premium_subscriptions_updated_at
  BEFORE UPDATE ON public.premium_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
