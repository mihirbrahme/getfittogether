
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

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

async function resetPassword(email, newPassword) {
    console.log(`--- Script execution started ---`);
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
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
    );

    if (updateError) {
        console.error('Error updating password:', updateError.message);
    } else {
        console.log(`Successfully updated password for ${email}`);
    }
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: node scripts/reset_password.js <email> <new_password>');
    process.exit(1);
}

const [email, newPassword] = args;
resetPassword(email, newPassword);
