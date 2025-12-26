import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manually parse .env.local because we cannot blindly install dotenv
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const env: Record<string, string> = {};

        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^"(.*)"$/, '$1'); // Remove quotes if present
                env[key] = value;
            }
        });
        return env;
    } catch (err) {
        console.error('Error reading .env.local:', err);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase Credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('\n🔍 Verifying GFT Database Schema...\n');
    let allPassed = true;

    // Helper to log result
    const logResult = (name: string, success: boolean, keys: string[] = []) => {
        if (success) {
            console.log(`✅ [${name}] Table exists & accessible.`);
            if (keys.length > 0) console.log(`   Fields found: ${keys.join(', ')}`);
        } else {
            console.log(`❌ [${name}] Validation Failed.`);
            allPassed = false;
        }
    };

    // 1. Verify Profiles
    const { data: profiles, error: profileError } = await supabase.from('profiles').select('id, full_name, height, weight, status').limit(1);
    if (profileError) {
        console.error(`   Error: ${profileError.message}`);
        logResult('Profiles', false);
    } else {
        logResult('Profiles', true, Object.keys(profiles?.[0] || {}));
    }

    // 2. Verify User Goals
    const { data: goals, error: goalsError } = await supabase.from('user_goals').select('id, user_id, goal_name, points, active').limit(1);
    if (goalsError) {
        console.error(`   Error: ${goalsError.message}`);
        logResult('User Goals', false);
    } else {
        logResult('User Goals', true, Object.keys(goals?.[0] || {}));
    }

    // 3. Verify Groups
    const { data: groups, error: groupsError } = await supabase.from('groups').select('id, name, code').limit(1);
    if (groupsError) {
        console.error(`   Error: ${groupsError.message}`);
        logResult('Groups', false);
    } else {
        logResult('Groups', true, Object.keys(groups?.[0] || {}));
    }

    // 4. Verify Group Members
    const { data: members, error: membersError } = await supabase.from('group_members').select('group_id, user_id, status').limit(1);
    if (membersError) {
        console.error(`   Error: ${membersError.message}`);
        logResult('Group Members', false);
    } else {
        logResult('Group Members', true, Object.keys(members?.[0] || {}));
    }

    console.log('\n-----------------------------------');
    if (allPassed) {
        console.log('🎉 VERIFICATION SUCCESSFUL: All tables and fields are correctly configured.');
    } else {
        console.log('⚠️ VERIFICATION FAILED: Some tables or fields are missing or inaccessible.');
    }
}

verify();
