/**
 * Chrome Web Store API Integration
 * Handles authentication and upload to Chrome Web Store
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

class ChromeStoreAPI {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.refreshToken = config.refreshToken;
    this.extensionId = config.extensionId;
    this.auth = null;
  }

  async authenticate() {
    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );

    oauth2Client.setCredentials({
      refresh_token: this.refreshToken,
    });

    this.auth = oauth2Client;
    return oauth2Client;
  }

  async uploadPackage(zipPath, notes = '') {
    if (!this.auth) {
      await this.authenticate();
    }

    const chromeWebstore = google.chromewebstore({
      version: 'v1.1',
      auth: this.auth,
    });

    try {
      console.log('📤 Uploading package to Chrome Web Store...');

      // Upload the package
      const uploadResponse = await chromeWebstore.items.upload({
        file: fs.createReadStream(zipPath),
        media: {
          mimeType: 'application/zip',
        },
      });

      console.log('✅ Package uploaded successfully');

      // Publish the update
      if (notes) {
        await chromeWebstore.items.publish({
          itemId: this.extensionId,
          publishTarget: 'default',
          requestBody: {
            notes: notes,
          },
        });
      }

      console.log('✅ Extension published successfully');
      return uploadResponse.data;
    } catch (error) {
      console.error('❌ Upload failed:', error.message);
      throw error;
    }
  }

  async getExtensionInfo() {
    if (!this.auth) {
      await this.authenticate();
    }

    const chromeWebstore = google.chromewebstore({
      version: 'v1.1',
      auth: this.auth,
    });

    try {
      const response = await chromeWebstore.items.get({
        itemId: this.extensionId,
      });

      return response.data;
    } catch (error) {
      console.error('❌ Failed to get extension info:', error.message);
      throw error;
    }
  }

  async updateDescription(description) {
    if (!this.auth) {
      await this.authenticate();
    }

    const chromeWebstore = google.chromewebstore({
      version: 'v1.1',
      auth: this.auth,
    });

    try {
      await chromeWebstore.items.update({
        itemId: this.extensionId,
        requestBody: {
          description: description,
        },
      });

      console.log('✅ Description updated successfully');
    } catch (error) {
      console.error('❌ Failed to update description:', error.message);
      throw error;
    }
  }
}

module.exports = ChromeStoreAPI;
