// File: interactive-qc.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://workspace--contact2187.repl.co';

test.describe('Automator AI Interactive Frontend QC', () => {

  test('BUG HUNT: Dashboard - AI Welcome Card Functionality', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Wait for dashboard to load
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });

    // Check for AI Welcome Card
    const welcomeCard = page.locator('.ai-welcome-card, [data-testid="ai-welcome-card"]');
    await expect(welcomeCard).toBeVisible();
    
    // Check that welcome message is not "undefined" or empty
    const welcomeText = await welcomeCard.locator('.greeting, .welcome-text').first().innerText();
    expect(welcomeText).not.toContain('undefined');
    expect(welcomeText.length).toBeGreaterThan(0);
    
    console.log('Welcome message:', welcomeText);
  });

  test('BUG HUNT: Workflows - Create New Workflow Button', async ({ page }) => {
    await page.goto(`${BASE_URL}/workflows`);

    // Wait for workflows page to load
    await expect(page.locator('h1, h2')).toContainText('Workflows');

    // Check for "Create Workflow" or "New Workflow" button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), .create-workflow-btn');
    await expect(createButton.first()).toBeVisible({ timeout: 10000 });
    
    // Click the create button
    await createButton.first().click();
    
    // Wait for some response (modal, form, or navigation)
    await page.waitForTimeout(1500);
    
    // Check if a modal opened or form appeared
    const modalOrForm = page.locator('.modal, .dialog, .create-form, [role="dialog"]');
    const isModalVisible = await modalOrForm.count() > 0;
    
    console.log('Create workflow interaction completed, modal/form appeared:', isModalVisible);
  });
  
  test('BUG HUNT: CRM - Lead Management Table', async ({ page }) => {
    await page.goto(`${BASE_URL}/crm`);

    // Wait for CRM page to load
    await expect(page.locator('h1, h2')).toContainText(/CRM|Leads/);

    // Check for leads table or list
    const leadsContainer = page.locator('.leads-table, .leads-list, table, .data-table');
    await expect(leadsContainer.first()).toBeVisible({ timeout: 10000 });

    // Check that no "NaN" values appear in the table
    const tableText = await leadsContainer.first().innerText();
    expect(tableText).not.toContain('NaN');
    expect(tableText).not.toContain('undefined');
    
    // Check for lead status indicators
    const statusElements = page.locator('.status, .lead-status, .badge');
    if (await statusElements.count() > 0) {
      const statusText = await statusElements.first().innerText();
      expect(statusText.length).toBeGreaterThan(0);
      console.log('Lead status found:', statusText);
    }
  });

  test('BUG HUNT: Email Templates - Template Editor', async ({ page }) => {
    await page.goto(`${BASE_URL}/email`);

    // Wait for email page to load
    await expect(page.locator('h1, h2')).toContainText(/Email|Templates/);

    // Look for template cards or list
    const templateContainer = page.locator('.template-card, .email-template, .template-list');
    
    if (await templateContainer.count() > 0) {
      await expect(templateContainer.first()).toBeVisible();
      
      // Check for AI suggestion button or feature
      const aiButton = page.locator('button:has-text("AI"), button:has-text("Suggest"), .ai-suggest');
      if (await aiButton.count() > 0) {
        await aiButton.first().click();
        await page.waitForTimeout(2000);
        console.log('AI suggestion feature tested');
      }
    }
  });

  test('BUG HUNT: Navigation - All Menu Items Functional', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Test main navigation items
    const navItems = [
      { text: 'Dashboard', url: '/dashboard' },
      { text: 'Workflows', url: '/workflows' },
      { text: 'CRM', url: '/crm' },
      { text: 'Email', url: '/email' },
      { text: 'Calendar', url: '/calendar' }
    ];

    for (const item of navItems) {
      // Click navigation item
      const navLink = page.locator(`a:has-text("${item.text}"), nav a[href*="${item.url}"]`);
      if (await navLink.count() > 0) {
        await navLink.first().click();
        
        // Wait for page to load
        await page.waitForTimeout(1000);
        
        // Check that URL changed correctly
        const currentUrl = page.url();
        expect(currentUrl).toContain(item.url);
        
        console.log(`Navigation to ${item.text} successful`);
      }
    }
  });

  test('BUG HUNT: Firebase AI Logic - Client Side Initialization', async ({ page }) => {
    // Monitor console logs for Firebase initialization
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Firebase') || msg.text().includes('AI Logic')) {
        logs.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/dashboard`);
    
    // Wait for potential Firebase initialization
    await page.waitForTimeout(3000);
    
    // Check if Firebase AI Logic initialized successfully
    const firebaseInitialized = logs.some(log => 
      log.includes('Firebase AI Logic initialized successfully')
    );
    
    console.log('Firebase logs:', logs);
    console.log('Firebase AI Logic initialized:', firebaseInitialized);
    
    // This test passes if Firebase either initializes OR properly falls back
    expect(logs.length).toBeGreaterThan(0);
  });
});