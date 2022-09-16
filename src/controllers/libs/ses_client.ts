import  { SESClient }  from  '@aws-sdk/client-ses'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

// Create SES service object
export const sesClient = new SESClient({ region: process.env.AWS_REGION })