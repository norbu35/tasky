import json
from pathlib import Path

def set_nested(d, key, value):
    parts = key.split('.')
    for p in parts[:-1]:
        d = d.setdefault(p, {})
    d[parts[-1]] = value

# Subscription translations
sub_keys = {
    'heroTitle': {'en': 'Become a Tasker Pro', 'mn': 'Tasker Pro болоорой'},
    'heroDescription': {'en': 'Priority boost and additional benefits.', 'mn': 'Priority boost болон нэмэлт боломжууд.'},
    'ineligibleTitle': {'en': 'Not eligible', 'mn': 'Шаардлага хангаагүй'},
    'planStandard': {'en': 'Standard', 'mn': 'Стандарт'},
    'planPremium': {'en': 'Premium', 'mn': 'Премиум'},
    'activeLabel': {'en': 'Active', 'mn': 'Идэвхтэй'},
    'planStandardDesc': {'en': 'More visibility and more trust.', 'mn': 'Илүү харагдах байдал ба илүү итгэлцэл.'},
    'confirmBody': {'en': 'Activate Tasker Pro subscription?', 'mn': 'Tasker Pro subscription-ийг идэвхжүүлэх үү?'},
    'confirmTitle': {'en': 'Confirm your choice', 'mn': 'Сонголтоо шалгана уу'},
    'subscribeAction': {'en': 'Subscribe', 'mn': 'Бүртгүүлэх'},
    'ineligibleDesc': {'en': 'Tasker Pro requires 4.5+ rating to be eligible', 'mn': 'Tasker Pro бүртгэлд нийцэхийн тулд 4.5+ үнэлгээ шаардлагатай'}
}

for lang in ['en', 'mn']:
    path = Path(f'apps/mobile/src/locales/{lang}/translation.json')
    data = json.loads(path.read_text())
    
    for k, v in sub_keys.items():
        set_nested(data, f'tasker.subscription.{k}', v[lang])

    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(f"Updated {path}")
