import os
import json
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('backend/.env')
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))
res = supabase.table('items').select('*').execute()

with open('scratch/out.json', 'w', encoding='utf-8') as f:
    json.dump(res.data, f, ensure_ascii=False, indent=2)
