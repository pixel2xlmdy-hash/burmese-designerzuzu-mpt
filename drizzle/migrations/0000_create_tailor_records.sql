CREATE TABLE public.tailor_records (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL DEFAULT 'measurement',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tailor_records TO authenticated;
GRANT ALL ON public.tailor_records TO service_role;

ALTER TABLE public.tailor_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read their records" ON public.tailor_records
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert their records" ON public.tailor_records
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update their records" ON public.tailor_records
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete their records" ON public.tailor_records
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX tailor_records_user_updated_idx ON public.tailor_records (user_id, updated_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.tailor_records;