import yaml
import glob
from pathlib import Path

copy_map = {}
for file in glob.glob('docs/design/screen-specs/*.yaml'):
    with open(file, 'r') as f:
        try:
            data = yaml.safe_load(f)
            if 'copy' in data and data['copy']:
                for item in data['copy']:
                    key = item.get('key')
                    en = item.get('en')
                    mn = item.get('mn')
                    if key and en and mn:
                        # Assuming the key in YAML is just the last part or suffix
                        copy_map[f"{Path(file).stem}:{key}"] = {'en': en, 'mn': mn}
        except Exception as e:
            print(f"Error parsing {file}: {e}")

for k, v in list(copy_map.items())[:10]:
    print(k, v)
