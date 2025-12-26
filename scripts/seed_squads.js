
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
let envConfig = {};

if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            envConfig[key] = value;
        }
    });
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedSquads() {
    console.log('Seeding squads...');
    const squads = [
        { name: 'Alpha Squad', code: 'ALPHA' },
        { name: 'Bravo Squad', code: 'BRAVO' },
        { name: 'Charlie Squad', code: 'CHARLIE' }
    ];

    for (const squad of squads) {
        const { data, error } = await supabase
            .from('groups')
            .upsert(squad, { onConflict: 'code' })
            .select();

        if (error) {
            console.error(`Error seeding ${squad.name}:`, error.message);
        } else {
            console.log(`Seeded ${squad.name}`);
        }
    }
    console.log('Done.');
}

seedSquads();
