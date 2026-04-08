import json
from pathlib import Path

def set_nested(d, key, value):
    parts = key.split('.')
    for p in parts[:-1]:
        d = d.setdefault(p, {})
    d[parts[-1]] = value

# Escrow translations
escrow_keys = {
    'title': {'en': 'Escrow Payment', 'mn': 'Эскроу төлбөр'},
    'optInTitle': {'en': 'Add protection with escrow payment', 'mn': 'Эскроу төлбөрөөр хамгаалалт нэмэх'},
    'featureProtection': {'en': 'Money protection', 'mn': 'Мөнгөн хамгаалалт'},
    'featureDispute': {'en': 'Dispute resolution', 'mn': 'Маргаан шийдвэрлэх боломж'},
    'featureAutoTransfer': {'en': 'Automatic transfer', 'mn': 'Автомат шилжүүлэг'},
    'confirmTitle': {'en': 'Confirm', 'mn': 'Баталгаажуулах'},
    'cancelText': {'en': 'Go back', 'mn': 'Буцах'},
    'paymentFailed': {'en': 'Payment failed', 'mn': 'Төлбөр амжилтгүй'},
    'paymentConfirmed': {'en': 'Payment confirmed', 'mn': 'Төлбөр баталгаажлаа'},
    'escrowSuccess': {'en': 'Escrow successful!', 'mn': 'Эскроу амжилттай!'},
    'escrowHeldDescription': {'en': 'Payment is securely held in escrow.', 'mn': 'Төлбөр аюулгүй эскроу дансанд хадгалагдаж байна.'},
    
    # Missing ones from the file
    'errorDescription': {'en': 'Escrow payment cannot proceed currently.', 'mn': 'Эскроу төлбөрийг одоогоор үргэлжлүүлэх боломжгүй байна.'},
    'optInDescription': {'en': 'Payment will be securely deposited. Tasker receives money only after completion.', 'mn': 'Төлбөрийг аюулгүй данс руу байршуулна. Ажил дууссаны дараа л гүйцэтгэгч мөнгөө авна'},
    'useEscrow': {'en': 'Use Escrow', 'mn': 'Эскроу ашиглах'},
    'sheetDescription': {'en': 'By confirming to use Escrow, your payment will be securely held.', 'mn': 'Эскроу ашиглахыг баталгаажуулснаар төлбөр аюулгүй хадгалагдана.'},
    'continueBtn': {'en': 'Continue', 'mn': 'Үргэлжлүүлэх'},
}

for lang in ['en', 'mn']:
    path = Path(f'apps/mobile/src/locales/{lang}/translation.json')
    data = json.loads(path.read_text())
    
    for k, v in escrow_keys.items():
        set_nested(data, f'customer.bookings.escrowFlow.{k}', v[lang])

    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(f"Updated {path}")
