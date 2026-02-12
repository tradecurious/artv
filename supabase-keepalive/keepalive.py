import os
import time
import logging
import requests
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
log = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://dnkdbwxsygtptwbemydc.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRua2Rid3hzeWd0cHR3YmVteWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjMyMDEsImV4cCI6MjA4NTg5OTIwMX0.hAWLFTJApDZDi4P1WlqzlME7ILFg5wvj58qyBDnUR30')
PING_INTERVAL_DAYS = 6
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 60


def ping_supabase():
    """Ping Supabase by querying the mailing_list table."""
    url = f"{SUPABASE_URL}/rest/v1/mailing_list?select=count&limit=1"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            log.info(f"Pinging Supabase (attempt {attempt}/{MAX_RETRIES})...")
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            log.info(f"✅ Ping successful! Status: {response.status_code} | Time: {datetime.utcnow().isoformat()}Z")
            return True
        except requests.exceptions.RequestException as e:
            log.error(f"❌ Ping failed (attempt {attempt}/{MAX_RETRIES}): {e}")
            if attempt < MAX_RETRIES:
                log.info(f"Retrying in {RETRY_DELAY_SECONDS} seconds...")
                time.sleep(RETRY_DELAY_SECONDS)

    log.error("All retry attempts failed.")
    return False


def main():
    log.info("🚀 Supabase keepalive service started.")
    log.info(f"Pinging every {PING_INTERVAL_DAYS} days to prevent free-tier pause.")

    while True:
        ping_supabase()
        interval_seconds = PING_INTERVAL_DAYS * 24 * 60 * 60
        next_ping = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        log.info(f"Next ping in {PING_INTERVAL_DAYS} days. Sleeping...")
        time.sleep(interval_seconds)


if __name__ == "__main__":
    main()
