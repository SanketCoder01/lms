const supabase = require('../config/db');

const defaultTypes = [
    'Application For Allotment',
    'Allotment Letter',
    'SBA',
    'Purchase Agreement',
    'Possession Handover',
    'Conveyance Deed',
    'Sale Deed',
    'Agreement to Sell',
    'Transfer Deed',
    'Gift Deed',
    'Other'
];

async function seedTypes() {
    try {
        console.log('Checking and seeding ownership document types in Supabase...');
        
        // Check existing types
        const { data: existing, error: fetchError } = await supabase
            .from('ownership_document_types')
            .select('name');
        
        if (fetchError) {
            console.error('Error fetching existing types:', fetchError);
            process.exit(1);
        }

        const existingNames = (existing || []).map(e => e.name);
        console.log('Existing types:', existingNames);

        // Insert missing types
        for (const type of defaultTypes) {
            if (!existingNames.includes(type)) {
                const { error: insertError } = await supabase
                    .from('ownership_document_types')
                    .insert({ name: type, is_active: true });
                
                if (insertError) {
                    console.error(`Failed to insert ${type}:`, insertError);
                } else {
                    console.log(`Added: ${type}`);
                }
            } else {
                console.log(`Exists: ${type}`);
            }
        }

        // Show final list
        const { data: final } = await supabase
            .from('ownership_document_types')
            .select('*')
            .order('name');
        
        console.log('\nFinal document types:');
        final.forEach(t => console.log(`  ${t.id}: ${t.name}`));
        
        console.log('\nSeeding complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding types:', err);
        process.exit(1);
    }
}

seedTypes();
