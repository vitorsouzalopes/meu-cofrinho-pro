-- Create app_config table
CREATE TABLE IF NOT EXISTS public.app_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    min_version TEXT NOT NULL DEFAULT '1.0.0',
    download_url TEXT NOT NULL DEFAULT 'https://meu-cofrinho-pro.lovable.app',
    message TEXT DEFAULT 'Uma nova versão obrigatória está disponível. Por favor, atualize o aplicativo para continuar.',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access to version config
CREATE POLICY "Public can view app config" 
ON public.app_config FOR SELECT 
USING (true);

-- Insert initial version record
INSERT INTO public.app_config (min_version, download_url)
VALUES ('1.0.0', 'https://meu-cofrinho-pro.lovable.app')
ON CONFLICT DO NOTHING;
