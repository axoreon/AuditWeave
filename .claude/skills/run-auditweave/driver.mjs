#!/usr/bin/env node
/**
 * AuditWeave Web Application Driver
 *
 * Automated driver for interacting with the AuditWeave GRC compliance platform.
 * Uses Playwright to launch browsers, navigate the UI, and capture screenshots.
 *
 * Commands:
 *   launch         - Start backend and frontend servers
 *   screenshot     - Take a screenshot of the home page
 *   audit-new      - Navigate to new audit page and take screenshot
 *   audit-batch    - Navigate to batch audit page and take screenshot
 *   history        - Navigate to audit history page and take screenshot
 *   stop           - Stop all servers
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../..');

let backendProcess = null;
let frontendProcess = null;
let browser = null;
let page = null;

const BACKEND_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = join(projectRoot, 'screenshots');

// Utility to wait for server to be ready
async function waitForServer(url, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 404) {
        return true;
      }
    } catch (e) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Server at ${url} did not start within ${maxAttempts} seconds`);
}

// Launch backend server
async function launchBackend() {
  console.log('Starting backend server...');
  const backendDir = join(projectRoot, 'backend');
  const pythonPath = join(backendDir, '.venv', 'Scripts', 'python.exe');

  backendProcess = spawn(pythonPath, ['main.py'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: true
  });

  await waitForServer(BACKEND_URL);
  console.log('✓ Backend server ready at', BACKEND_URL);
}

// Launch frontend server
async function launchFrontend() {
  console.log('Starting frontend server...');
  const frontendDir = join(projectRoot, 'frontend');

  frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: true
  });

  await waitForServer(FRONTEND_URL);
  console.log('✓ Frontend server ready at', FRONTEND_URL);
}

// Initialize browser
async function initBrowser() {
  if (!browser) {
    console.log('Launching browser...');
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    console.log('✓ Browser ready');
  }
  return page;
}

// Take screenshot
async function takeScreenshot(path, url = FRONTEND_URL) {
  const page = await initBrowser();
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for main content to load
  await page.waitForTimeout(2000);

  console.log(`Taking screenshot: ${path}`);
  await page.screenshot({ path, fullPage: true });
  console.log(`✓ Screenshot saved to ${path}`);
}

// Commands
const commands = {
  async launch() {
    await launchBackend();
    await launchFrontend();
    console.log('\n✓ AuditWeave is running!');
    console.log(`  Backend:  ${BACKEND_URL}`);
    console.log(`  Frontend: ${FRONTEND_URL}`);
  },

  async screenshot() {
    const screenshotPath = join(SCREENSHOT_DIR, 'home.png');
    await takeScreenshot(screenshotPath);
  },

  async 'audit-new'() {
    const screenshotPath = join(SCREENSHOT_DIR, 'audit-new.png');
    await takeScreenshot(screenshotPath, `${FRONTEND_URL}/audit/new`);
  },

  async 'audit-batch'() {
    const screenshotPath = join(SCREENSHOT_DIR, 'audit-batch.png');
    await takeScreenshot(screenshotPath, `${FRONTEND_URL}/audit/batch`);
  },

  async history() {
    const screenshotPath = join(SCREENSHOT_DIR, 'history.png');
    await takeScreenshot(screenshotPath, `${FRONTEND_URL}/history`);
  },

  async stop() {
    console.log('Stopping servers...');

    if (browser) {
      await browser.close();
      browser = null;
      page = null;
    }

    if (backendProcess) {
      backendProcess.kill();
      backendProcess = null;
    }

    if (frontendProcess) {
      frontendProcess.kill();
      frontendProcess = null;
    }

    console.log('✓ All servers stopped');
  }
};

// Main execution
const command = process.argv[2] || 'launch';

if (!commands[command]) {
  console.error(`Unknown command: ${command}`);
  console.log('Available commands:', Object.keys(commands).join(', '));
  process.exit(1);
}

try {
  await commands[command]();
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

// Cleanup on exit
process.on('SIGINT', async () => {
  await commands.stop();
  process.exit(0);
});
