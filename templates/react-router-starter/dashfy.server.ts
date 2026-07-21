import { Dashfy } from '@getdashfy/server'

// Create a new Dashfy server instance
const dashfy = new Dashfy()

// Load dashboard configuration
await dashfy.configureFromFile('./dashfy.config.yml')

// Start server
await dashfy.start()
