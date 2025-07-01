#!/usr/bin/env node

/**
 * Chrome Web Store API Setup Script
 * Helps configure API credentials for automated deployment
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

class ChromeAPISetup {
  constructor() {
    this.envFile = '.env';
    this.envExampleFile = '.env.example';
  }

  async setup() {
    console.log('🔧 Chrome Web Store API Setup\n');
    console.log(
      'This script will help you configure API credentials for automated deployment.\n'
    );

    try {
      // Create .env.example if it doesn't exist
      await this.createEnvExample();

      // Get credentials from user
      const credentials = await this.getCredentials();

      // Save to .env file
      await this.saveCredentials(credentials);

      // Test the configuration
      await this.testConfiguration(credentials);

      console.log('\n✅ Setup completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Add .env to your .gitignore (if not already there)');
      console.log('2. Run: npm run deploy');
      console.log('3. Or use: node scripts/deploy.js');
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
    } finally {
      rl.close();
    }
  }

  async createEnvExample() {
    const exampleContent = `# Chrome Web Store API Credentials
# Get these from https://console.developers.google.com/

# OAuth 2.0 Client ID
CHROME_CLIENT_ID=your_client_id_here

# OAuth 2.0 Client Secret
CHROME_CLIENT_SECRET=your_client_secret_here

# Refresh Token (obtained through OAuth flow)
CHROME_REFRESH_TOKEN=your_refresh_token_here

# Extension ID (found in Chrome Web Store Developer Dashboard)
CHROME_EXTENSION_ID=your_extension_id_here

# Optional: Release notes for the update
CHROME_RELEASE_NOTES=Updated version with bug fixes and improvements
`;

    if (!fs.existsSync(this.envExampleFile)) {
      fs.writeFileSync(this.envExampleFile, exampleContent);
      console.log('📝 Created .env.example file');
    }
  }

  async getCredentials() {
    const credentials = {};

    console.log('🔑 Please provide your Chrome Web Store API credentials:\n');

    credentials.clientId = await this.question('OAuth 2.0 Client ID: ');
    credentials.clientSecret = await this.question('OAuth 2.0 Client Secret: ');
    credentials.refreshToken = await this.question('Refresh Token: ');
    credentials.extensionId = await this.question('Extension ID: ');
    credentials.releaseNotes = await this.question(
      'Release Notes (optional): '
    );

    return credentials;
  }

  async saveCredentials(credentials) {
    const envContent = `# Chrome Web Store API Credentials
CHROME_CLIENT_ID=${credentials.clientId}
CHROME_CLIENT_SECRET=${credentials.clientSecret}
CHROME_REFRESH_TOKEN=${credentials.refreshToken}
CHROME_EXTENSION_ID=${credentials.extensionId}
CHROME_RELEASE_NOTES=${credentials.releaseNotes || ''}
`;

    fs.writeFileSync(this.envFile, envContent);
    console.log('💾 Credentials saved to .env file');
  }

  async testConfiguration(credentials) {
    console.log('\n🧪 Testing configuration...');

    // Basic validation
    if (
      !credentials.clientId ||
      !credentials.clientSecret ||
      !credentials.refreshToken ||
      !credentials.extensionId
    ) {
      throw new Error('Missing required credentials');
    }

    // Check if extension ID format is valid
    if (!/^[a-z]{32}$/.test(credentials.extensionId)) {
      console.warn('⚠️  Extension ID format looks unusual. Please verify.');
    }

    console.log('✅ Configuration validation passed');
  }

  question(prompt) {
    return new Promise(resolve => {
      rl.question(prompt, answer => {
        resolve(answer.trim());
      });
    });
  }
}

// CLI interface
if (require.main === module) {
  const setup = new ChromeAPISetup();
  setup.setup();
}

module.exports = ChromeAPISetup;
