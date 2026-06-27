import { Page } from "@playwright/test";

export const VALID_USER = {
  username: "Heath93",
  password: "s3cret",
};

export const SECOND_USER = {
  username: "Arvilla_Hegmann",
  password: "s3cret",
};

/**
 * The frontend is configured to call the backend on port 3001 (via VITE_BACKEND_PORT),
 * but the Express backend is actually running on port 3003 in this environment
 * (because port 3001 is occupied by another process and detect-port shifted it).
 * We intercept all requests to port 3001 and forward them to port 3003.
 */
export async function setupApiProxy(page: Page): Promise<void> {
  await page.route(/localhost:3001/, async (route) => {
    const url = route.request().url().replace("localhost:3001", "localhost:3003");
    try {
      const response = await route.fetch({ url });
      await route.fulfill({ response });
    } catch {
      // Route may already be handled (page redirected, connection closed, etc.)
      // Attempt to abort but silently ignore if already handled.
      await route.abort().catch(() => {});
    }
  });
}

/**
 * Fill an MUI TextField whose data-test attribute is on the outer wrapper div.
 * MUI TextField places data-test on the FormControl div, not the inner <input>.
 * We must descend into the input child to type.
 */
export function getInput(page: Page, testId: string) {
  return page.locator(`[data-test="${testId}"] input`);
}

/**
 * Log in via the UI sign-in form. Sets up the API proxy first.
 */
export async function loginViaUi(
  page: Page,
  username = VALID_USER.username,
  password = VALID_USER.password
): Promise<void> {
  await setupApiProxy(page);
  await page.goto("http://localhost:3000/signin");
  await getInput(page, "signin-username").fill(username);
  await getInput(page, "signin-password").fill(password);
  await page.getByTestId("signin-submit").click();
  // Wait until the sidenav is visible — confirms we are logged in
  await page.getByTestId("sidenav").waitFor({ state: "visible", timeout: 15000 });
}

/**
 * Dismiss the user-onboarding dialog if it appears.
 * Some test scenarios create fresh accounts which will see the dialog.
 */
export async function dismissOnboardingIfPresent(page: Page): Promise<void> {
  const dialog = page.getByTestId("user-onboarding-dialog");
  const isVisible = await dialog.isVisible().catch(() => false);
  if (isVisible) {
    // Click Next to move past step 1
    const nextBtn = page.getByTestId("user-onboarding-next");
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    }
    // If we land on step 2 (bank account form), fill it out quickly
    const bankNameInput = page.locator('[data-test="bankaccount-bankName-input"] input');
    if (await bankNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bankNameInput.fill("Test Bank");
      await page.locator('[data-test="bankaccount-routingNumber-input"] input').fill("123456789");
      await page.locator('[data-test="bankaccount-accountNumber-input"] input').fill("123456789");
      await page.getByTestId("bankaccount-submit").click();
    }
    // Click Done / Next on step 3
    const doneBtn = page.getByTestId("user-onboarding-next");
    if (await doneBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await doneBtn.click();
    }
  }
}
