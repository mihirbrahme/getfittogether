
console.log('--- Script execution started ---');
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function resetPassword(email: string, newPassword: string) {
    console.log(`Attempting to reset password for: ${email}`);

    // 1. Find the user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError.message);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error(`User with email ${email} not found.`);
        return;
    }

    // 2. Update the password
    const { data, error: updateError } = await supabase.auth.admin.updateUserByCustId(
        user.id,
        { password: newPassword }
    );

    // Wait, updateUserById is more standard
    const { data: updatedData, error: updateErr } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
    );

    if (updateErr) {
        console.error('Error updating password:', updateErr.message);
    } else {
        console.log(`Successfully updated password for ${email}`);
    }
}

// Get arguments from command line
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: npx ts-node scripts/reset_password.ts <email> <new_password>');
    process.exit(1);
}

const [email, newPassword] = args;
resetPassword(email, newPassword);
