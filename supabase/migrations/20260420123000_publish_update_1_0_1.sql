-- Update min_version to force update to 1.0.1
UPDATE public.app_config 
SET min_version = '1.0.1', 
    updated_at = now()
WHERE id IN (SELECT id FROM public.app_config ORDER BY updated_at DESC LIMIT 1);
