import yaml
import os
import re

def find_expo_files(base_dir):
    files = []
    for root, _, filenames in os.walk(base_dir):
        for f in filenames:
            if f.endswith('.tsx') and not f.startswith('_'):
                files.append(os.path.join(root, f))
    return files

def expo_path_to_route(filepath, base_dir):
    # apps/mobile/src/app/(auth)/index.tsx -> /(auth)
    # apps/mobile/src/app/(customer)/tasks/[taskId]/index.tsx -> /(customer)/tasks/:taskId
    rel_path = os.path.relpath(filepath, base_dir)
    route = rel_path.replace('.tsx', '')
    if route.endswith('/index'):
        route = route[:-6]
    if route == 'index':
        route = '/'
    else:
        route = '/' + route
        
    # Convert [taskId] to :taskId
    route = re.sub(r'\[(.*?)\]', r':\1', route)
    return route, filepath

def main():
    with open('docs/design/screen-inventory.yaml', 'r') as f:
        inventory = yaml.safe_load(f)

    base_dir = 'apps/mobile/src/app'
    expo_files = find_expo_files(base_dir)
    
    route_map = {}
    for f in expo_files:
        route, filepath = expo_path_to_route(f, base_dir)
        route_map[route] = filepath
        # Also store without groups for matching
        clean_route = re.sub(r'/\([^)]+\)', '', route)
        if not clean_route:
            clean_route = '/'
        route_map[clean_route] = filepath

    print("Mapped routes:")
    # for k,v in route_map.items():
    #     print(f"{k} -> {v}")

    # Map inventory to files
    updates = 0
    file_injections = {}
    
    for screen in inventory.get('screens', []):
        scr_id = screen['id']
        spec_route = screen.get('route')
        if not spec_route:
            continue
            
        matched_file = None
        # Try exact match first
        if spec_route in route_map:
            matched_file = route_map[spec_route]
        else:
            # Try matching clean spec_route against clean routes
            # e.g. spec /auth/login -> (auth)/index.tsx?
            # It's better to manually define some hard mappings if they are completely different
            if spec_route == '/auth/login': matched_file = route_map.get('/(auth)')
            elif spec_route == '/auth/otp-verify': matched_file = route_map.get('/(auth)/otp')
            elif spec_route == '/auth/otp-migration': matched_file = route_map.get('/(auth)/otp-migration')
            elif spec_route == '/onboarding': matched_file = route_map.get('/onboarding')
            elif spec_route == '/onboarding/role': matched_file = route_map.get('/(auth)/role-select')
            elif spec_route == '/onboarding/permission-camera': matched_file = route_map.get('/(auth)/permission-camera')
            elif spec_route == '/onboarding/permission-location': matched_file = route_map.get('/(auth)/permission-location')
            elif spec_route == '/onboarding/permission-notifications': matched_file = route_map.get('/(auth)/permission-notifications')
            elif spec_route == '/inbox': matched_file = route_map.get('/(tabs)/inbox')
            elif spec_route == '/inbox/:conversationId': matched_file = route_map.get('/(tabs)/inbox/:id')
            elif spec_route == '/profile': matched_file = route_map.get('/(tabs)/profile')
            elif spec_route == '/profile/edit': matched_file = route_map.get('/(shared)/profile/edit')
            elif spec_route == '/profile/settings': matched_file = route_map.get('/(shared)/profile/settings')
            elif spec_route == '/profile/settings/delete': matched_file = route_map.get('/(shared)/profile/delete')
            elif spec_route == '/notifications': matched_file = route_map.get('/(shared)/notifications')
            elif spec_route == '/(customer)/tasks': matched_file = route_map.get('/(customer)/tasks')
            elif spec_route == '/(tasker)/browse': matched_file = route_map.get('/(tabs)') # The browse feed is at tabs/index.tsx
            
        if matched_file:
            # Find the actual expo route for this file
            actual_route = [k for k, v in route_map.items() if v == matched_file and '(' in k or k == '/'][0]
            if screen['route'] != actual_route:
                print(f"Updating route for {scr_id} from {screen['route']} to {actual_route}")
                screen['route'] = actual_route
                updates += 1
            file_injections[matched_file] = scr_id
        else:
            print(f"Could not map: {scr_id} -> {spec_route}")

    # Write back the yaml
    if updates > 0:
        with open('docs/design/screen-inventory.yaml', 'w') as f:
            yaml.dump(inventory, f, sort_keys=False, default_flow_style=False)
            
    print(f"\nFound {len(file_injections)} files to inject testIDs into.")
    for filepath, scr_id in file_injections.items():
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Naive injection: find the first return (...) and inject testID into the first tag
        if 'testID="' + scr_id + '"' not in content:
            # Look for the first component return
            # Using regex to find the topmost element inside return (...)
            pattern = re.compile(r'(return\s*\(\s*<[A-Z][a-zA-Z0-9]*)([\s>])')
            
            def replacer(match):
                return match.group(1) + f' testID="{scr_id}"' + match.group(2)
                
            new_content, count = pattern.subn(replacer, content, count=1)
            
            if count > 0:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Injected {scr_id} into {filepath}")
            else:
                print(f"Failed to inject into {filepath}")

if __name__ == '__main__':
    main()
