import json
import re

def flatten_dict(d, parent_key='', sep='.'):
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

try:
    with open('apps/mobile/src/locales/en/translation.json', 'r') as f:
        en_data = json.load(f)
        
    with open('apps/mobile/src/locales/mn/translation.json', 'r') as f:
        mn_data = json.load(f)
except Exception as e:
    print("Error loading files:", e)
    exit(1)

if '_translationMeta' in en_data:
    del en_data['_translationMeta']
if '_translationMeta' in mn_data:
    del mn_data['_translationMeta']

en_flat = flatten_dict(en_data)
mn_flat = flatten_dict(mn_data)

en_keys = set(en_flat.keys())
mn_keys = set(mn_flat.keys())

missing_in_mn = en_keys - mn_keys
missing_in_en = mn_keys - en_keys

print("=== KEYS MISSING IN MN ===")
if not missing_in_mn:
    print("None")
for k in sorted(missing_in_mn):
    print(k)

print("\n=== KEYS MISSING IN EN ===")
if not missing_in_en:
    print("None")
for k in sorted(missing_in_en):
    print(k)

cyrillic_re = re.compile(r'[\u0400-\u04FF]')

print("\n=== POTENTIAL WRONG VALUES IN EN (Contains Cyrillic) ===")
wrong_en = 0
for k, v in en_flat.items():
    if isinstance(v, str) and cyrillic_re.search(v):
        print(f"{k}: {v}")
        wrong_en += 1
if not wrong_en:
    print("None")

print("\n=== POTENTIAL WRONG VALUES IN MN (No Cyrillic, has Latin words > 2 chars) ===")
wrong_mn = 0
for k, v in mn_flat.items():
    if isinstance(v, str):
        if not cyrillic_re.search(v):
            if re.search(r'[A-Za-z]{2,}', v):
                # We can ignore placeholders like {{...}} or purely brand names if we want, but let's list them
                if not (v.startswith('{{') and v.endswith('}}')):
                    print(f"{k}: {v}")
                    wrong_mn += 1
if not wrong_mn:
    print("None")

