const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const supabase = require('./backend/config/db');

async function test() {
    console.log("URL:", process.env.SUPABASE_URL);
    console.log("Token:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "EXISTS" : "MISSING");
    
    const { data, error } = await supabase.from('filter_options').insert({
        category: 'TestCat', option_value: 'TestVal', status: 'active'
    }).select();
    
    if (error) {
        console.error("SUPABASE ERROR:", error);
    } else {
        console.log("SUCCESS:", data);
        await supabase.from('filter_options').delete().eq('id', data[0].id);
    }
}
test();
