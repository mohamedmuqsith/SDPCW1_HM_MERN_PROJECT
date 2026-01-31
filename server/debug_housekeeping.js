const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const serviceRequestSchema = new mongoose.Schema({
    type: String,
    status: String
}, { strict: false });

const ServiceRequest = mongoose.models.ServiceRequest || mongoose.model('ServiceRequest', serviceRequestSchema);

async function checkTasks() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const allTasks = await ServiceRequest.find({});
        console.log(`Total Tasks: ${allTasks.length}`);

        const housekeepingTasks = await ServiceRequest.find({ type: { $in: ['Cleaning', 'Housekeeping'] } });
        console.log(`Housekeeping/Cleaning Tasks: ${housekeepingTasks.length}`);

        if (housekeepingTasks.length > 0) {
            console.log('Sample Task:', JSON.stringify(housekeepingTasks[0], null, 2));
        } else {
            // Check for case sensitivity issues
            const lowercaseTasks = await ServiceRequest.find({ type: { $in: ['cleaning', 'housekeeping'] } });
            console.log(`Lowercase tasks (mismatch): ${lowercaseTasks.length}`);

            const allTypes = await ServiceRequest.distinct('type');
            console.log('All Task Types in DB:', allTypes);
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTasks();
