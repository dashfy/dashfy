import { createGitHubClient } from '@getdashfy/ext-github'
import { createNbaClient } from '@getdashfy/ext-nba'
import { createSystemClient } from '@getdashfy/ext-system/client'
import { Dashfy } from '@getdashfy/server'

// Create a new Dashfy server instance
const dashfy = new Dashfy()

// Load dashboard configuration
await dashfy.configureFromFile('./dashfy.config.yml')

// Register GitHub API
// Get your token at: https://github.com/settings/tokens
// Set it with: export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx in .env file
dashfy.registerApi(
  'github',
  createGitHubClient({
    token: process.env.GITHUB_TOKEN!,
  }),
)

// Register NBA API
dashfy.registerApi('nba', createNbaClient())

// Register System API (push mode for real-time updates)
dashfy.registerApi('system', createSystemClient(), 'push')

// Start server
await dashfy.start()
