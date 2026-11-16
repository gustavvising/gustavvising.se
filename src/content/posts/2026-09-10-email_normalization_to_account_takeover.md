---
title: "Email normalization to account takeover"
description: "john.doe@gmail.com and johndoe@gmail.com are the same inbox. When a rate limiter disagrees, you get unlimited OTP codes and an account takeover."
date: 2026-09-10
slug: email_normalization_to_account_takeover
---

Did you know that john.doe@gmail.com and johndoe@gmail.com are the same email? Or that john.doe+1@gmail.com is also the same email address. Many email services provide this feature and it is usable for things like:

-   Spinning up a second account using the “same” email.
-   Filtering and organizing with aliases such as +shopping.
-   Tracking which service that shared your email with advertisers.

Usually when signing up for a service, these email variations are treated as completely new addresses. But this is more of a convention than a rule. An account system had this exception that it treated those email addresses as the same email. So far so good. But what happens when there is no integrity in this practice between different systems? It turned out that the rate limiting system was set to the usual standard of treating such addresses as different. This led to a vulnerability in which it was possible to generate an infinite number of OTP codes (codes used to authorize once).

<figure><img src="/images/otp-codes.png" alt="OTP codes sent to email inbox" loading="lazy" /><figcaption>OTP codes sent to email inbox</figcaption></figure>

Those codes were for the password reset service, so by guessing one correctly, it would be possible to reset the account’s password! There are a lot of variations of codes, but with a guessing speed of one guess per second, it would take around 11 days to get one correct guess. An attack like this could theoretically be detected by a logging and alerting system. However, relying on this for security is not sufficient.

A trick that makes the attack stealthier is using an alias that the email service provider deems invalid, but the account system does not. It turns out that appending the sequence of `..+anything` prevents the email from reaching the victim’s inbox, but still generates a valid OTP.

By cooking up an automated script, it’s possible to exploit this vulnerability and brute force the OTP to achieve account takeover. There are three guesses per OTP before it becomes invalid and a new code is requested by the script.

<figure><img src="/images/otp-brute-force.png" alt="Brute forcing the OTP codes" loading="lazy" /><figcaption>Brute forcing the OTP codes</figcaption></figure>

This vulnerability shows that integrity between different systems is necessary. Together, they form a larger system that exposes a completely new attack surface.
