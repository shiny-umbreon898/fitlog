import os
import threading
import smtplib
from email.message import EmailMessage

# Simple SMTP email helper used to send asynchronous emails.
# This module intentionally keeps a small footprint and uses only the standard
# library so there are no extra dependencies.
#
# CONFIGURATION (read from environment variables):
#   MAIL_HOST: SMTP server hostname (required to send mail)
#   MAIL_PORT: SMTP server port (required to send mail)
#   MAIL_USERNAME: username for SMTP auth (optional)
#   MAIL_PASSWORD: password for SMTP auth (optional)
#   MAIL_FROM: the From address to use for sent emails (defaults to no-reply@fitlog.local)
#   MAIL_USE_SSL: if true, use SMTP over SSL (SMTPS)
#   MAIL_USE_TLS: if true, use STARTTLS upgrade on plain SMTP connection
#   MAIL_DEBUG: if true, print email details to console instead of sending (dev mode)
#
# SETUP FOR DEVELOPMENT:
#   Option 1 (No emails):
#     Set MAIL_DEBUG=true to print emails to console without sending
#   
#   Option 2 (Gmail SMTP):
#     MAIL_HOST=smtp.gmail.com
#     MAIL_PORT=587
#     MAIL_USE_TLS=true
#     MAIL_USERNAME=your-email@gmail.com
#     MAIL_PASSWORD=your-app-password
#     MAIL_FROM=your-email@gmail.com
#   
#   Option 3 (Local test server - mailhog):
#     MAIL_HOST=localhost
#     MAIL_PORT=1025
#
# SETUP FOR PRODUCTION:
#   Use a transactional email service (SendGrid, Mailgun, etc.) for reliability.

DEFAULT_FROM = os.getenv("MAIL_FROM", "no-reply@fitlog.local")


def _send_email_smtp(msg: EmailMessage):
    """Internal helper that performs the SMTP connection and sends the EmailMessage.

    This function is intentionally synchronous and designed to run in a separate
    background thread. It reads SMTP configuration from environment variables.
    """
    # Check if debug mode is enabled (print instead of send)
    if os.getenv("MAIL_DEBUG", "false").lower() in ("1", "true", "yes"):
        print("=" * 60)
        print("EMAIL DEBUG MODE (not sending)")
        print("=" * 60)
        print(f"To: {msg['To']}")
        print(f"From: {msg['From']}")
        print(f"Subject: {msg['Subject']}")
        print("-" * 60)
        print(msg.get_content())
        print("=" * 60)
        return

    host = os.getenv("MAIL_HOST")
    port = int(os.getenv("MAIL_PORT", "0")) if os.getenv("MAIL_PORT") else None
    username = os.getenv("MAIL_USERNAME")
    password = os.getenv("MAIL_PASSWORD")
    use_ssl = os.getenv("MAIL_USE_SSL", "false").lower() in ("1", "true", "yes")
    use_tls = os.getenv("MAIL_USE_TLS", "false").lower() in ("1", "true", "yes")

    # If no SMTP server configured, skip sending rather than raising an exception.
    if not host or not port:
        print("[MAIL] WARNING: Email not sent - MAIL_HOST or MAIL_PORT not configured")
        print("[MAIL] To send emails, set MAIL_DEBUG=true for console output or configure SMTP")
        return

    try:
        # Choose SSL-wrapped SMTP or plain SMTP socket
        if use_ssl:
            server = smtplib.SMTP_SSL(host, port)
        else:
            server = smtplib.SMTP(host, port)

        # Use context manager to ensure connection is closed cleanly
        with server:
            # Identify to the SMTP server
            server.ehlo()
            # Optionally upgrade to TLS if requested and not using SSL socket
            if use_tls and not use_ssl:
                server.starttls()
                server.ehlo()
            # Optionally authenticate if credentials provided
            if username and password:
                server.login(username, password)
            # Send the pre-composed EmailMessage object
            server.send_message(msg)
        # Log success in production replace with proper logging
        print(f"[MAIL] Email sent to {msg['To']}")
    except Exception as e:
        # Don't raise caller should treat sending as best-effort. Print details
        # so developers can inspect failures during development.
        print(f"[MAIL] ERROR: Failed to send email to {msg['To']}: {e}")


def send_welcome_email_async(to_email: str, username: str):
    """Compose and send a welcome email in a background thread.

    Args:
        to_email: recipient email address
        username: account username used in the greeting

    Returns:
        threading.Thread object that was started (daemon) so callers may join
        if they wish, but typical usage is fire-and-forget.
    """
    subject = "Welcome to Fitlog"
    # Keep the message plain-text and simple. For richer templates consider
    # using a templating engine and HTML part with a text fallback.
    body = (
        f"Hi {username},\n\n"
        "Welcome to Fitlog! We are excited to have you on board.\n\n"
        "You can now log in and start tracking your workouts and meals.\n\n"
        "Best regards,\n"
        "The Fitlog Team"
    )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = os.getenv("MAIL_FROM", DEFAULT_FROM)
    msg["To"] = to_email
    msg.set_content(body)

    # Run the send operation in a daemon thread so it won't block shutdown.
    thread = threading.Thread(target=_send_email_smtp, args=(msg,))
    thread.daemon = True
    thread.start()
    return thread
