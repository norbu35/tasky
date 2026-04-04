import fs from 'fs';
import yaml from 'yaml';
import path from 'path';

const inventoryFile = fs.readFileSync('docs/design/screen-inventory.yaml', 'utf8');
const inventory = yaml.parse(inventoryFile);

const errors = [];

inventory.screens.forEach(screen => {
    // Check if the route exists in expo-router format.
    // E.g. route: "/auth/login" might be "apps/mobile/src/app/(auth)/login.tsx" or "apps/mobile/src/app/auth/login.tsx"
    
    // We just want to check if SCR tags are used in the codebase
    // Let's just output the screens to analyze
});

console.log("Inventory parsed successfully.");
