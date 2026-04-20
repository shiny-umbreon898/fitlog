import os
import argparse
from pathlib import Path

"""Small utility to test the welcome email sender.

Usage examples:
  # Quick console debug (prints email instead of sending):
  python backend/test_send_email.py --email aaronghafoor5@gmail.com --username Aaron --debug

  # Use environment config (MAIL_HOST, MAIL_PORT, etc.) and send real email:
  MAIL_HOST=smtp.example.com MAIL_PORT=587 MAIL_USERNAME=... MAIL_PASSWORD=... python backend/test_send_email.py --email you@example.com --username You

The script will call send_welcome_email_async and wait up to a timeout for the background thread.
"""

# load .env if exists
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
except Exception:
    pass

parser = argparse.ArgumentParser(description='Send a test welcome email using backend.app.email')
parser.add_argument('--email', '-e', default=os.getenv('TEST_EMAIL', ''), help='Recipient email address')
parser.add_argument('--username', '-u', default=os.getenv('TEST_USERNAME', 'testuser'), help='Recipient username')
parser.add_argument('--debug', action='store_true', help='Enable MAIL_DEBUG to print email to console instead of sending')
parser.add_argument('--timeout', type=float, default=10.0, help='Seconds to wait for background thread')
args = parser.parse_args()

if not args.email:
    print('Error: recipient email must be provided via --email or TEST_EMAIL env var')
    parser.print_help()
    raise SystemExit(1)

if args.debug:
    os.environ['MAIL_DEBUG'] = 'true'

print(f"Testing welcome email to: {args.email} (username: {args.username})")
print(f"MAIL_DEBUG={os.getenv('MAIL_DEBUG')}")

# Import the helper late so env vars take effect
from app.email import send_welcome_email_async

thread = send_welcome_email_async(args.email, args.username)

# Wait for the thread to finish (but don't block indefinitely)
thread.join(timeout=args.timeout)
print('Done')