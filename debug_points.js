
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim();
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkActivities() {
    console.log('Fetching squad_checkin_activities...');
    const { data: activities, error } = await supabase
        .from('squad_checkin_activities')
        .select('*');

    if (error) {
        console.error('Error fetching activities:', error);
    } else {
        console.log('Activities:', JSON.stringify(activities, null, 2));
    }

    console.log('\nFetching goal_templates...');
    const { data: goals, error: goalError } = await supabase
        .from('goal_templates')
        .select('*');

    if (goalError) {
        console.error('Error fetching goals:', goalError);
    } else {
        console.log('Goal Templates:', JSON.stringify(goals, null, 2));
    }
}

checkActivities();
