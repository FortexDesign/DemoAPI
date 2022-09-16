import  { S3Client  }  from  '@aws-sdk/client-s3'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

// Create S3 service object
export const AWSS3Client = new S3Client({ region: process.env.AWS_REGION })