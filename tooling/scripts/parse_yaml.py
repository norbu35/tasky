import re
import os
import glob

def find_tsx_files(directory):
    tsx_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".tsx"):
                tsx_files.append(os.path.join(root, file))
    return tsx_files

def parse_yaml_screens(filepath):
    screens = []
    current_screen = {}
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if line.startswith("- id:"):
                if current_screen:
                    screens.append(current_screen)
                current_screen = {'id': line.split("id:")[1].strip().strip('"\'')}
            elif line.startswith("route:"):
                current_screen['route'] = line.split("route:")[1].strip().strip('"\'')
            elif line.startswith("name:"):
                current_screen['name'] = line.split("name:")[1].strip().strip('"\'')
    if current_screen:
        screens.append(current_screen)
    return screens

def check_drifts():
    screens = parse_yaml_screens('docs/design/screen-inventory.yaml')
    tsx_files = find_tsx_files('apps/mobile/src/app')
    
    # We will just print the route and check if it maps well
    print("Checking route drifts...")
    for screen in screens:
        route = screen.get('route')
        name = screen.get('name')
        scr_id = screen.get('id')
        
        if not route:
            continue
        
        # Convert route to a possible expo-router path
        # E.g. /auth/login -> (auth)/login or auth/login or (auth)/index if route is just /auth
        # This is a bit tricky, so let's just print them out nicely to analyze manually or with LLM
        print(f"Spec: {scr_id} -> {route} ({name})")

if __name__ == '__main__':
    check_drifts()
