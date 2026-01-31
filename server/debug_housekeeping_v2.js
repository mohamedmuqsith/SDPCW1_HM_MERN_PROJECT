import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const serviceRequestSchema = new mongoose.Schema({
    type: String,
    status: String
}, { strict: false });

// Only register if not already registered (to avoid overwrite error in some envs)
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
            console.log('No tasks found, creating one...');
            await ServiceRequest.create({
                type: 'Housekeeping',
                status: 'New',
                priority: 'High',
                details: 'Test housekeeping task created by debugger',
                roomNumber: '101'
            });
            console.log('Created TEST task.');
        }

        // Always create a FRESH "New" task to be sure
        await ServiceRequest.create({
            type: 'Housekeeping',
            status: 'New',
            priority: 'Medium',
            details: 'Fresh Debug Task ' + new Date().toISOString(),
            roomNumber: '202'
        });
        console.log('Created FRESH New task.');

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTasks();
