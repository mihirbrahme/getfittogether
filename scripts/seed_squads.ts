
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Ideally use service role key if RLS blocks, but Anon might work if policy allows insert or if I'm just testing. 
// Actually I need the service role key to bypass RLS for seeding if I'm not logged in.
// But I don't have the service role key in the env vars usually exposed to client. 
// I will try with ANON key and see if I can insert as I might have 'public' policies or I can't.
// Wait, I am an "Admin" logically, but the script runs outside the browser context.
// If I can't find the service role key, I might need to ask the user or just assume it's in a .env file locally.

// Let's assume there is a .env.local file.
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

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
            .upsert(squad, { onConflict: 'code' }) // Assuming code is unique or just insert
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
