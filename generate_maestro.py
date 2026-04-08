import yaml
import os

with open('docs/design/journey-catalog.yaml', 'r') as f:
    data = yaml.safe_load(f)

flows_dir = 'apps/mobile/maestro/flows/'
os.makedirs(flows_dir, exist_ok=True)

for journey in data.get('journeys', []):
    j_id = journey.get('id')
    name = journey.get('name')
    if not j_id: continue
    
    file_name = f"{j_id}-{name.lower().replace(' ', '-').replace('/', '-').replace('(', '').replace(')', '').replace('+', '')}.yaml"
    file_path = os.path.join(flows_dir, file_name)
    
    # Don't overwrite manually created ones
    if j_id in ['JRN-SHARED-01', 'JRN-SHARED-02'] and os.path.exists(file_path):
        continue

    lines = []
    lines.append(f'appId: mn.tasky.mobile')
    lines.append('---')
    lines.append(f'# Journey {j_id}: {name}')
    if journey.get('goal'):
        lines.append(f'# Goal: {journey.get("goal")}')
    lines.append('')
    lines.append('- launchApp')
    lines.append('')
    
    happy_path = journey.get('happy_path', [])
    for step in happy_path:
        screen_id = step.get('screen')
        action = step.get('action')
        lines.append(f'# Step {step.get("step")}: {action}')
        if screen_id:
            lines.append(f'- extendedWaitUntil:')
            lines.append(f'    visible:')
            lines.append(f'      id: "{screen_id}"')
            lines.append(f'    timeout: 5000')
            # Add a tap as a placeholder for the action, utilizing the next screen or just the action text
            # Usually Maestro specs might need specific IDs, but for the basic spec we can just assert visibility
            lines.append(f'# TODO: Add specific interactions for "{action}"')
        lines.append('')
        
    with open(file_path, 'w') as f:
        f.write('\n'.join(lines))
    
    print(f"Generated {file_path}")
