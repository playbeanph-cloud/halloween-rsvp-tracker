# Playbean Halloween RSVP tracker

This folder is a standalone static site. Publish it with GitHub Pages and keep the server access code out of the repository.

## Server setup

Add `HALLOWEEN_RSVP_ADMIN_TOKEN` to the Render service environment variables, using a long random value, then redeploy the server. Staff enter that same value in the tracker page. It is kept only in the browser tab's session storage.

## Resend email

Import `halloween-rsvp-email.html` into Resend. The buttons use Resend contact variables and call the Render server directly. A click records the response, then redirects to the existing Playbean thank-you page.

Use this subject line: `Will we see you at Playbean’s Spooktacular Carnival?`
