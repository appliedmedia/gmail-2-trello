#!/usr/bin/env node

/**
 * Chrome Web Store Deployment Script
 * Automates the process of building and uploading the extension
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

class ChromeWebStoreDeployer {
  constructor() {
    this.extensionDir = 'chrome_manifest_v3';
    this.distDir = 'dist';
    this.manifestPath = path.join(this.extensionDir, 'manifest.json');
  }

  async deploy() {
    try {
      console.log('🚀 Starting Chrome Web Store deployment...\n');

      // Step 1: Validate environment
      this.validateEnvironment();

      // Step 2: Build the extension
      await this.buildExtension();

      // Step 3: Upload to Chrome Web Store
      await this.uploadToStore();

      console.log('✅ Deployment completed successfully!');
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }

  validateEnvironment() {
    console.log('🔍 Validating environment...');

    // Check if manifest exists
    if (!fs.existsSync(this.manifestPath)) {
      throw new Error(`Manifest file not found: ${this.manifestPath}`);
    }

    // Check required environment variables
    const requiredEnvVars = [
      'CHROME_CLIENT_ID',
      'CHROME_CLIENT_SECRET',
      'CHROME_REFRESH_TOKEN',
      'CHROME_EXTENSION_ID',
    ];

    const missingVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    );
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`
      );
    }

    console.log('✅ Environment validation passed');
  }

  async buildExtension() {
    console.log('📦 Building extension...');

    // Read manifest to get version
    const manifest = JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));
    const version = manifest.version;
    const extensionName = manifest.name.replace(/\s+/g, '-').toLowerCase();

    // Create dist directory
    if (!fs.existsSync(this.distDir)) {
      fs.mkdirSync(this.distDir, { recursive: true });
    }

    const zipPath = path.join(this.distDir, `${extensionName}-v${version}.zip`);

    // Create zip file
    await this.createZipArchive(this.extensionDir, zipPath);

    console.log(`✅ Extension built: ${zipPath}`);
    return zipPath;
  }

  async createZipArchive(sourceDir, outputPath) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        console.log(`📦 Archive created: ${archive.pointer()} bytes`);
        resolve(outputPath);
      });

      archive.on('error', err => {
        reject(err);
      });

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  async uploadToStore() {
    console.log('📤 Uploading to Chrome Web Store...');

    // This would integrate with Chrome Web Store API
    // For now, we'll provide instructions for manual upload
    console.log('\n📋 Manual Upload Instructions:');
    console.log('1. Go to https://chrome.google.com/webstore/devconsole/');
    console.log('2. Select your extension');
    console.log('3. Click "Upload Updated Package"');
    console.log('4. Select the zip file from the dist/ directory');
    console.log('5. Update the description and release notes');
    console.log('6. Submit for review');

    // TODO: Implement actual API integration
    // const chromeStoreAPI = new ChromeStoreAPI({
    //   clientId: process.env.CHROME_CLIENT_ID,
    //   clientSecret: process.env.CHROME_CLIENT_SECRET,
    //   refreshToken: process.env.CHROME_REFRESH_TOKEN,
    //   extensionId: process.env.CHROME_EXTENSION_ID
    // });
    // await chromeStoreAPI.uploadPackage(zipPath);
  }
}

// CLI interface
if (require.main === module) {
  const deployer = new ChromeWebStoreDeployer();
  deployer.deploy();
}

module.exports = ChromeWebStoreDeployer;
