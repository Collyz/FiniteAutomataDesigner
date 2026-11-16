-- ============================================================================
-- Local development seed data
-- Run automatically by `supabase db reset`, or manually via:
--   psql "$DATABASE_URL" -f supabase/seed.sql
--
-- Creates one test user (email/password) and a couple of sample automata
-- so contributors have something to log into and look at immediately,
-- without needing Google OAuth or a manual sign-up step.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Test user
--   email:    demo@example.com
--   password: password123
-- --------------------------------------------------------------------------

DO $$
DECLARE
  demo_user_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN

  -- auth.users: the actual account record GoTrue authenticates against
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    demo_user_id,
    'authenticated',
    'authenticated',
    'demo@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO NOTHING;

  -- auth.identities: required alongside auth.users for email/password login
  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    demo_user_id::text,
    demo_user_id,
    jsonb_build_object('sub', demo_user_id::text, 'email', 'demo@example.com'),
    'email',
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;

  -- --------------------------------------------------------------------------
  -- Sample automata for the test user
  -- --------------------------------------------------------------------------

  INSERT INTO public.finite_automata (id, user_id, name, type, description, automaton)
  VALUES (
    '00000000-0000-0000-0000-000000000101',
    demo_user_id,
    'Sample DFSM',
    'DFA',
    'Accepts binary strings that end in 1.',
    '{
        "arrows": [
            {
            "id": "a16",
            "to": "c5",
            "from": "c4",
            "transition": [
                "1"
            ],
            "parallelPart": 0.7181467181467182,
            "lineAngleAdjust": 3.141592653589793,
            "perpendicularPart": -33
            },
            {
            "id": "a17",
            "to": "c5",
            "from": "c5",
            "transition": [
                "1"
            ],
            "anchorAngle": -1.5707963267948966
            },
            {
            "id": "a27",
            "to": "c4",
            "from": "c5",
            "transition": [
                "0"
            ],
            "parallelPart": 0.49034749034749037,
            "lineAngleAdjust": 3.141592653589793,
            "perpendicularPart": -33
            },
            {
            "id": "a28",
            "to": "c4",
            "from": "c4",
            "transition": [
                "0"
            ],
            "anchorAngle": -1.5707963267948966
            }
        ],
        "circles": [
            {
            "x": 264.3999938964844,
            "y": 270,
            "id": "c4",
            "text": "",
            "isAccept": false
            },
            {
            "x": 523.3999938964844,
            "y": 270,
            "id": "c5",
            "text": "",
            "isAccept": true
            }
        ],
        "alphabet": [
            "0",
            "1"
        ],
        "entryArrow": {
            "deltaX": -139,
            "deltaY": 0,
            "startPoint": {
            "x": 115.39999389648438,
            "y": 274
            },
            "startState": "c4"
        }
    }'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.finite_automata (id, user_id, name, type, description, automaton)
  VALUES (
    '00000000-0000-0000-0000-000000000102',
    demo_user_id,
    'Sample NDFSM',
    'NFA',
    'Accepts binary strings that contain the substring 01.',
    '{
        "arrows": [
            {
            "id": "a15",
            "to": "c1",
            "from": "c0",
            "transition": [
                "0"
            ],
            "parallelPart": 0.5,
            "lineAngleAdjust": 0,
            "perpendicularPart": 0
            },
            {
            "id": "a36",
            "to": "c2",
            "from": "c1",
            "transition": [
                "1"
            ],
            "parallelPart": 0.5,
            "lineAngleAdjust": 0,
            "perpendicularPart": 0
            },
            {
            "id": "a37",
            "to": "c0",
            "from": "c0",
            "transition": [
                "0",
                "1"
            ],
            "anchorAngle": -1.5707963267948966
            },
            {
            "id": "a38",
            "to": "c2",
            "from": "c2",
            "transition": [
                "0",
                "1"
            ],
            "anchorAngle": -1.5707963267948966
            }
        ],
        "circles": [
            {
            "x": 219.39999389648438,
            "y": 276,
            "id": "c0",
            "text": "",
            "isAccept": false
            },
            {
            "x": 394.3999938964844,
            "y": 276,
            "id": "c1",
            "text": "",
            "isAccept": false
            },
            {
            "x": 587.3999938964844,
            "y": 276,
            "id": "c2",
            "text": "",
            "isAccept": true
            }
        ],
        "alphabet": [
            "0",
            "1"
        ],
        "entryArrow": {
            "deltaX": -100,
            "deltaY": 0,
            "startPoint": {
            "x": 61.399993896484375,
            "y": 272
            },
            "startState": "c0"
        }
    }'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;

  -- Drawing from the draw-only page (/draw). Transition labels are free-form,
  -- and every entry arrow goes in "entryArrows" (this one has none).
  INSERT INTO public.finite_automata (id, user_id, name, type, description, automaton)
  VALUES (
    '00000000-0000-0000-0000-000000000103',
    demo_user_id,
    'Sample Drawing',
    'DRAW',
    'Six states joined by curved arrows, drawn on the draw-only page.',
    '{
        "arrows": [
            {
            "id": "a0",
            "to": "c51",
            "from": "c50",
            "transition": [],
            "parallelPart": 0.6221859706362153,
            "lineAngleAdjust": 0,
            "perpendicularPart": 85.94389459376701
            },
            {
            "id": "a1",
            "to": "c50",
            "from": "c51",
            "transition": [],
            "parallelPart": 0.5778907974282698,
            "lineAngleAdjust": 0,
            "perpendicularPart": -98.75793739562084
            },
            {
            "id": "a2",
            "to": "c53",
            "from": "c52",
            "transition": [],
            "parallelPart": 0.6084833494823806,
            "lineAngleAdjust": 0,
            "perpendicularPart": -221.7490940613235
            },
            {
            "id": "a3",
            "to": "c52",
            "from": "c53",
            "transition": [],
            "parallelPart": 0.49095034882349764,
            "lineAngleAdjust": 0,
            "perpendicularPart": -298.6980976094162
            }
        ],
        "circles": [
            {
            "x": 335,
            "y": 167,
            "id": "c48",
            "text": "",
            "isAccept": true
            },
            {
            "x": 443,
            "y": 167,
            "id": "c49",
            "text": "",
            "isAccept": true
            },
            {
            "x": 298,
            "y": 333,
            "id": "c50",
            "text": "",
            "isAccept": false
            },
            {
            "x": 499,
            "y": 333,
            "id": "c51",
            "text": "",
            "isAccept": false
            },
            {
            "x": 119,
            "y": 278,
            "id": "c52",
            "text": "",
            "isAccept": false
            },
            {
            "x": 679,
            "y": 265,
            "id": "c53",
            "text": "",
            "isAccept": false
            }
        ],
        "alphabet": [],
        "entryArrow": {},
        "entryArrows": []
    }'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;

END $$;