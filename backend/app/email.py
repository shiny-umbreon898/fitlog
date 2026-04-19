import os
import threading
import smtplib
from email.message import EmailMessage

# Simple SMTP email helper. Configure via environment variables:
# MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM, MAIL_USE_SSL, MAIL_USE_TLS

DEFAULT_FROM = os.getenv("MAIL_FROM", "no-reply@fitlog.local")


def _send_email_smtp(msg: EmailMessage):
    host = os.getenv("MAIL_HOST")
    port = int(os.getenv("MAIL_PORT", "0")) if os.getenv("MAIL_PORT") else None
    username = os.getenv("MAIL_USERNAME")
    password = os.getenv("MAIL_PASSWORD")
    use_ssl = os.getenv("MAIL_USE_SSL", "false").lower() in ("1", "true", "yes")
    use_tls = os.getenv("MAIL_USE_TLS", "false").lower() in ("1", "true", "yes")

    if not host or not port:
        # No SMTP configured, print and return
        print("Email not sent: MAIL_HOST or MAIL_PORT not configured")
        return

    try:
        if use_ssl:
            server = smtplib.SMTP_SSL(host, port)
        else:
            server = smtplib.SMTP(host, port)
        with server:
            server.ehlo()
            if use_tls and not use_ssl:
                server.starttls()
                server.ehlo()
            if username and password:
                server.login(username, password)
            server.send_message(msg)
        print(f"Email sent to {msg['To']}")
    except Exception as e:
        print(f"Failed to send email to {msg['To']}: {e}")


def send_welcome_email_async(to_email: str, username: str):
    """Compose and send welcome email in a background thread"""
    subject = "Welcome to Fitlog"
    body = (
        f"Hi {username},\n\n"
        "Welcome to Fitlog\n\n"
    )

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = os.getenv("MAIL_FROM", DEFAULT_FROM)
    msg["To"] = to_email
    msg.set_content(body)

    thread = threading.Thread(target=_send_email_smtp, args=(msg,))
    thread.daemon = True
    thread.start()
    return thread
