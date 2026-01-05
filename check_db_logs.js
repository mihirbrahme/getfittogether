
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
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDailyLogs() {
    const today = new Date().toISOString().split('T')[0];
    console.log('Searching for logs on:', today);

    const { data: logs, error } = await supabase
        .from('daily_logs')
        .select('user_id, date, daily_points, custom_logs')
        .eq('date', today);

    if (error) {
        console.error('Error fetching logs:', error);
    } else {
        console.log(`Found ${logs.length} logs for today.`);
        logs.forEach(log => {
            console.log(`User: ${log.user_id} | Points: ${log.daily_points}`);

            const custom = log.custom_logs || {};
            const wod_id = '846001b5-bf0d-40ff-96a3-110cf179dc4e';
            console.log(`  > WOD (${wod_id}): ${custom[`activity_${wod_id}`]}`);
        });
    }
}

checkDailyLogs();
