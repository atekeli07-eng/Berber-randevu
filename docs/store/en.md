# Store listing (English)

Paste these into App Store Connect and Google Play Console. Replace the bracketed site with your domain.

## Shared

| Field | Value |
| --- | --- |
| App name | Berberimrandevu |
| Bundle / package | `com.berberimrandevu.app` |
| Primary language | Turkish. Add English as a second localization with this file. |
| Category | Business. Secondary, if asked: Lifestyle. |
| Support URL | `https://YOURDOMAIN/gizlilik` |
| Support email | The same address as `NEXT_PUBLIC_CONTACT_EMAIL` |
| Privacy policy | `https://YOURDOMAIN/gizlilik` |
| Terms | `https://YOURDOMAIN/kosullar` |
| KVKK notice | `https://YOURDOMAIN/kvkk` |

## Apple

Subtitle, 30 characters maximum: **Barber appointment book** (23).

Keywords, within 100 characters, no spaces:

`barber,appointment,booking,salon,calendar,turkey,shop,reservation`

Promotional text:

Berberimrandevu is the appointment book in a barber’s pocket. Customers do not create an account; they pick a day and time from the shop’s web link. You see the day, the team, and the service on your phone.

Description:

Berberimrandevu is an appointment book for barber shops in Turkey. Times use the Istanbul time zone.

The shop owner can:
- See today’s appointments and open times for each barber
- Add a walk-in or phone booking by hand
- Block a time
- Mark a visit done or cancel it
- Add services and edit duration and price
- Update the shop name, address, phone, logo, and cover
- Delete the account and the shop

Customers do not use this app. They book on the shop’s web link: service, barber, day, and time, then name and phone. Two people cannot take the same slot.

A staff account sees only that barber’s appointments. This version does not send SMS, WhatsApp, or email.

Age rating: 4+. Not made for children. No violence, sexual content, gambling, horror, profanity, or unrestricted web browser.

### Apple privacy nutrition label

No tracking. No ads. Data is not sold. Supabase is the infrastructure that runs the app; it is not a data broker.

| Data | Who | Linked | Purpose | Tracking |
| --- | --- | --- | --- | --- |
| Name | Customer booking. Also the salon owner’s and staff display name. | Yes | App functionality | No |
| Phone number | Customer booking | Yes | App functionality | No |
| Email address | Salon owner account and staff invite | Yes | App functionality, account management | No |
| Photos | Only if the owner picks a logo or cover | Yes | App functionality | No |

Answer No for: location, health, financial info, payment info, contacts, browsing history, search history, advertising identifier, purchase history, sensitive info, audio, customer-support chat, product interaction, crash data, performance data, diagnostics.

The photo library permission is only for the shop logo and cover. The app does not request location. A map field is a link the owner pastes.

Account deletion: Settings → Delete account and shop. Customer rows can be anonymized from the salon panel by phone number.

### Age rating answers

| Question | Answer |
| --- | --- |
| Cartoon or fantasy violence | None |
| Realistic violence | None |
| Sexual content or nudity | None |
| Profanity or crude humor | None |
| Horror or fear themes | None |
| Alcohol, tobacco, or drugs | None |
| Mature or suggestive themes | None |
| Gambling | None |
| Contests | None |
| Unrestricted web access | No |
| User-generated content | Yes: shop name and description. Not filtered in advance. Infrequent. |
| Made for kids | No |
| Result | 4+ |

## Google Play

Short description, 80 characters maximum: **Appointment book for barber shops. Customers pick a time without an account.** (76)

Use the description above as the full description.

App type: App. Category: Business.

Content rating: Everyone. No violence, sexual content, profanity, gambling, or horror. Not designed for children.

### Data safety

Does the app collect data: Yes.
Does the app share data: No. Supabase is a service provider and is not “sharing” under Play’s definition.
Is data encrypted in transit: Yes (HTTPS).
Can users request deletion: Yes. Account deletion is inside the app.

| Data type | Required | Purpose |
| --- | --- | --- |
| Name | Required for a booking | App functionality |
| Email | Required for a salon or staff account | Account management, app functionality |
| Phone number | Required for a customer booking. Optional on a manual booking. | App functionality |
| Photos | Optional | App functionality |

Not collected: location, financial info, advertising ID, app activity, in-app search, web browsing, audio, files, calendar, contacts, health, messages, crash logs, diagnostics.

Not used for advertising or marketing. There is no analytics SDK.
