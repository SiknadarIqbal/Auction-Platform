import dotenv from 'dotenv';
dotenv.config();

console.log('Testing DB URI access...');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Defined' : 'UNDEFINED');
if (process.env.MONGODB_URI) {
    console.log('URI starts with:', process.env.MONGODB_URI.substring(0, 15) + '...');
}
