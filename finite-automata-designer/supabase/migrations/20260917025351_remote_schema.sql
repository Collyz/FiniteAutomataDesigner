SET local check_function_bodies = off;

CREATE TABLE "public"."finite_automata" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     uuid,
  "name"        text                     DEFAULT 'Untitled Automaton'::text,
  "type"        text,
  "automaton"   jsonb                    NOT NULL,
  "created_at"  timestamp with time zone DEFAULT now(),
  "updated_at"  timestamp with time zone DEFAULT now(),
  "description" text,
  CONSTRAINT "finite_automata_pkey" PRIMARY KEY (id),
  CONSTRAINT "finite_automata_type_check" CHECK ((type = ANY (ARRAY['DFA'::text, 'NFA'::text, 'DRAW'::text])))
);

ALTER TABLE "public"."finite_automata"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_modified_column()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

ALTER TABLE "public"."finite_automata"
  ADD CONSTRAINT "finite_automata_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE TRIGGER update_table_updated_at
  BEFORE UPDATE ON public.finite_automata
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

CREATE POLICY "Users can manage their automata" ON "public"."finite_automata"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

GRANT EXECUTE ON FUNCTION "public"."update_modified_column"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."finite_automata" TO "anon", "authenticated", "postgres", "service_role";

