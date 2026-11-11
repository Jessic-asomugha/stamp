# Stamp: Project Brief

You are starting with no prior context, so this file explains everything you need.

## What this project is
Stamp (company name: Stamp LTD) is a Nigerian business and travel services company. Its services:
- **Identity services:** helping people create or retrieve identity documents (NIN, BVN).
- **Business services:** company registration, business name registration, logo and brand identity, websites.
- **Travel services:** visas, travel consultations, accommodation booking.

The website lets visitors learn about the company, request a service, and track their requests. Jess is building it solo as a freelance project. The client pays for domain, hosting and everything else, and wants it live as soon as possible.

## Where things stand
- A first version of the front end already exists in this project folder. It is plain HTML, CSS and JavaScript (no framework), built the same way as Jess's other client site. The client has seen it and liked it.
- **Your job is to modify the existing files, not rebuild them.** Jess has a limited usage budget, so make targeted edits. Do not rewrite whole pages unless a page genuinely cannot be fixed by editing.
- The back end has not been decided for this project. Do not build one. A Back End section will be added later.

## Task 1: Change the colors to plain black and white
- The site should be plain black and white. Keep it simple and professional.
- Light neutral grays are fine for subtle backgrounds, borders and dividers. No accent colors.
- Make the change through the shared stylesheet where possible (use CSS variables for colors if they are not already), so one edit changes the whole site.
- The client's logo can keep its own colors.

## Task 2: Wire the real service requirements into the request flow
The client has sent real requirements for three services, replacing the earlier placeholders. They are listed in the Service Requirements section below. Use them in two places:
1. **Services page.** Each service has an expandable card (description, who it's for, what to bring, timeline, Request button). Use the requirements as the "what to bring" content for that service.
2. **Request a Service page.** The form is the client's qualifying step, so he only gets serious, well-prepared leads. Each service should show its own steps and required details.

### Open decision, do not guess
An earlier decision was that customers should NOT submit NIN or BVN numbers through the website, because the company helps people create or retrieve those documents. The requirements below list NIN and digital signature as things the client needs. Until Jess confirms how they are collected:
- Show them as things the client must **prepare and bring**.
- Do not add form fields that collect NIN numbers or digital signatures.
- Ask Jess before changing this.

## Pages (already planned and built)
Home, about, services, contact, sign up, login, forgot password, client dashboard, admin dashboard.

## Flow decisions that affect the front end
- Visitors can fill in a service request without an account. They then enter their email and receive a link that confirms the email, creates the account and logs them in to their dashboard.
- Each request has a progress timeline and a messaging thread (client and admin can both comment).
- Clients can cancel or withdraw a request from their dashboard.
- Consultations are a scheduling request, not a document submission.
- Services page uses expandable cards, not separate pages per service.
- Contact page has a form, a Google Map and a link.
- Roles (client, admin, later staff) are planned from the start.

## Do NOT do
- No boxed promo or call-to-action banners at the bottom of pages ("ready to get started" style boxes). Jess dislikes these in all her designs.
- Keep the footer small. Do not let it dominate the page.

## Working approach
Jess is comfortable with HTML and CSS. Explain decisions briefly as you go. For each task, read the existing files first, give a short plan and wait for approval before editing.

---

# SERVICE REQUIREMENTS

Sent by the client. Wording is lightly cleaned up. "Director / shareholder" means a person who owns or runs the company.

## Company registration
1. **Reserve a name**
   - Desired name
   - Nature of business
2. **Prepare the core identity files** (for every director / shareholder)
   - NIN, with date of birth
   - Digital signature
   - Home address
   - Phone number and email address
   - Occupation
3. **Draft the incorporation documents**
   - Done by Stamp from what the client provides, including the Memorandum and Articles of Association and all form filling. Nothing for the client to submit at this step.
4. **Specify share capital** (only for a company with shareholders)
   - Authorised and paid-up capital
   - Number of shares each director has
5. **Company contact information**
   - Address
   - Phone number
   - Email address

## Business name registration
1. **Reserve a name**
   - Desired name
   - Nature of business
2. **Prepare the core identity files** (for each proprietor)
   - Passport photo
   - NIN, with date of birth
   - Digital signature
   - Home address
   - Phone number and email address
   - Occupation
3. **Business contact information**
   - Address
   - Phone number
   - Email address

## NIN retrieval
1. **Means of identification**
   - NIN number
   - Date of birth and a photo, to confirm the person is the true owner
- Note from the client: NIN registration (as opposed to retrieval) can only be done in person.

## Still missing
Requirements for the remaining services (BVN, logo and brand identity, websites, visas, travel consultation, accommodation booking) have not been sent yet. Leave placeholders for those, clearly marked, and do not invent requirements.

---

# BACK END

To be added later.