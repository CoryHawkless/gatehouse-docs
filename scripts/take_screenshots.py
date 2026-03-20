#!/usr/bin/env python3
"""
Secuird Documentation Screenshot Tool
======================================
Logs into the Secuird UI with a clean demo account (no PII) and captures
screenshots of all key pages for embedding in the documentation.

Usage:
    cd /home/james/cory/docs-setup/gatehouse-docs/scripts
    .venv/bin/python3 take_screenshots.py
"""

import time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager

# ── Config ─────────────────────────────────────────────────────────────────────
BASE_URL = "http://localhost:8080"
EMAIL    = "screenshots@secuird.tech"   # clean demo account — no PII
PASSWORD = "SecuirdDemo2026!"
OUT_DIR  = Path(__file__).parent.parent / "static" / "img" / "screenshots"
WINDOW_W = 1440
WINDOW_H = 900

# CSS injected on every page to hide dev-only chrome and scrollbars
CLEANUP_CSS = """
/* Hide Vite ApiDevTools floating button */
.fixed.bottom-4.right-4.z-50 { display: none !important; }
/* Hide ApiDevTools expanded panel */
.fixed.bottom-0.left-0.right-0.z-50 { display: none !important; }
/* Hide Vite error overlay */
vite-error-overlay { display: none !important; }
/* Hide scrollbars for cleaner screenshots */
::-webkit-scrollbar { display: none !important; }
"""

# ── Pages ──────────────────────────────────────────────────────────────────────
# (filename_stem, path, wait_css_selector)
PAGES = [
    ("login",        "/login",            "input[type='email']"),
    ("org-overview", "/org",              ".p-6"),
    ("members",      "/org/members",      ".p-6"),
    ("departments",  "/org/departments",  ".p-6"),
    ("cas",          "/org/cas",          ".p-6"),
    ("policies",     "/org/policies",     ".p-6"),
    ("audit",        "/org/audit",        ".p-6"),
    ("oidc-clients", "/org/clients",      ".p-6"),
    ("api-keys",     "/org/api-keys",     ".p-6"),
    ("profile",      "/profile",          ".p-6"),
    ("security",     "/security",         ".p-6"),
    ("ssh-keys",     "/ssh-keys",         ".p-6"),
    ("activity",     "/activity",         ".p-6"),
    ("cli-guide",    "/cli-guide",        ".p-6"),
    ("dashboard",    "/org",              ".p-6"),
]

# ── Helpers ────────────────────────────────────────────────────────────────────

def make_driver():
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--disable-gpu")
    opts.add_argument(f"--window-size={WINDOW_W},{WINDOW_H}")
    opts.add_argument("--force-device-scale-factor=1")
    opts.add_argument("--hide-scrollbars")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)
    svc = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=svc, options=opts)
    driver.set_window_size(WINDOW_W, WINDOW_H)
    return driver


def inject_cleanup(driver):
    """Inject style to hide DevTools panel and scrollbars."""
    try:
        driver.execute_script("""
            var s = document.getElementById('__ss_clean');
            if (!s) { s = document.createElement('style'); s.id='__ss_clean'; document.head.appendChild(s); }
            s.textContent = arguments[0];
        """, CLEANUP_CSS)
    except Exception:
        pass


def wait_for(driver, selector, timeout=8):
    end = time.time() + timeout
    while time.time() < end:
        try:
            el = driver.find_element(By.CSS_SELECTOR, selector)
            if el.is_displayed():
                return True
        except NoSuchElementException:
            pass
        time.sleep(0.3)
    return False


def take(driver, name):
    """Inject cleanup, expand to full height, save screenshot."""
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    inject_cleanup(driver)
    time.sleep(0.2)
    h = driver.execute_script("return document.body.scrollHeight")
    driver.set_window_size(WINDOW_W, max(WINDOW_H, h))
    time.sleep(0.25)
    p = OUT_DIR / f"{name}.png"
    driver.save_screenshot(str(p))
    print(f"  ✓  {name}.png  ({p.stat().st_size // 1024} KB)")
    driver.set_window_size(WINDOW_W, WINDOW_H)


def login(driver):
    print("→ Logging in …")
    driver.get(f"{BASE_URL}/login")
    wait_for(driver, "input[type='email']", timeout=12)
    time.sleep(0.6)
    inject_cleanup(driver)

    # Screenshot the clean login page
    take(driver, "login")

    driver.find_element(By.CSS_SELECTOR, "input[type='email']").send_keys(EMAIL)
    driver.find_element(By.CSS_SELECTOR, "input[type='password']").send_keys(PASSWORD)
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    try:
        WebDriverWait(driver, 12).until(lambda d: "/login" not in d.current_url)
        print(f"  ✓  Redirected → {driver.current_url}")
        time.sleep(1)
        inject_cleanup(driver)
        return True
    except TimeoutException:
        driver.save_screenshot(str(OUT_DIR / "_login_fail.png"))
        print("  ✗  Login failed. Debug screenshot saved.")
        return False


def capture(driver, stem, path, wait_sel):
    if stem == "login":
        return   # already captured in login()
    print(f"→ {stem}  ({path})")
    driver.get(f"{BASE_URL}{path}")
    if not wait_for(driver, wait_sel, timeout=10):
        print(f"  ⚠  '{wait_sel}' not found, shooting anyway")
    time.sleep(0.9)
    inject_cleanup(driver)
    time.sleep(0.2)
    take(driver, stem)


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  Secuird — Production-Ready Documentation Screenshots")
    print(f"  Account : {EMAIL}")
    print(f"  Output  : {OUT_DIR}")
    print("=" * 60)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    driver = make_driver()
    try:
        if not login(driver):
            print("\nAborting.")
            return
        for stem, path, wait_sel in PAGES:
            try:
                capture(driver, stem, path, wait_sel)
            except Exception as e:
                print(f"  ✗  {stem}: {e}")
                try:
                    driver.save_screenshot(str(OUT_DIR / f"_err_{stem}.png"))
                except Exception:
                    pass
        print(f"\n✅  Done — {OUT_DIR}")
    finally:
        driver.quit()


if __name__ == "__main__":
    main()
