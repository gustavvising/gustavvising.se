---
title: "Hur jag hittade en broken access control i en svensk elbilstjänst"
description: "Det här är historien om hur jag hittade en Broken Access Control-sårbarhet som gjorde det möjligt att avboka godtyckliga bokningar i en svensk elbilstjänst. I praktiken innebar det att vem som helst kunde avboka andras bokningar."
date: 2026-03-30
slug: broken-access-control-elbilstjanst
---

Det här är historien om hur jag hittade en _Broken Access Control-sårbarhet_ som gjorde det möjligt att avboka godtyckliga bokningar i en svensk elbilstjänst. I praktiken innebar det att vem som helst kunde avboka andras bokningar.

Först ville jag förstå hur systemet var uppbyggt och kommunicerade med fordonen. Tjänsten använde en app för att hyra och låsa upp deras bilar. För att identifiera och komma åt API:et var det snabbaste sättet att reverse-engineera APK:en. När jag hade öppnat APK:en i ett dekompileringsverktyg såg jag att appen använde React och hade minimalt med synlig kod. Då först blev jag förvånad och trodde att appen laddade in en webbsida och att API:et fanns i React javascript. Efter att jag hittade ordet _“Hermes”_ i en konfigureringsfil och läste på om vad det betydde, insåg jag att koden fanns någon annanstans…

<figure><img src="/images/hbc-disasm-av-bundle.png" alt="Dekompilering av bundle-filen" loading="lazy" /><figcaption>Dekompilering av index.android.bundle</figcaption></figure>

Efter dekompilering fick jag ut en hasm-fil. Den började jag reverse-engineera och jag upptäckte då att appen kommunicerade över GraphQL. Efter lite mer trixande fick jag fram ett strukturerat schema över queries och mutations i API:et. Trots att de hade stängt av introspection.

Jag testade mig fram och ganska snart dök något upp. En mutation som hette `deleteBooking` gav inte unauthorized som de flesta övriga funktioner gjorde. Jag tänkte direkt _“tänk om det finns en broken access control här…“_.

För att det skulle vara en konkret risk behövdes andra personers boknings-ID:n. För att få en större attackyta skapade jag en legitim session via BankID. Jag upptäckte mutationerna `authBankID`, `authenticate` och satte ihop ett Python-skript för att automatisera processen. Först anropade jag `authBankID` för att få `autoStartToken` och sedan pollade jag `authenticate` en gång i sekunden tills en inloggning bekräftades via BankID-appen med `autoStartToken`.

Beväpnad med en giltig session kunde jag utforska fler funktioner i systemet. Härifrån kunde jag lista alla platser och deras fordon. Därefter kunde jag hämta bokningar för fordon genom `getBookingsForCar`.

<figure><img src="/images/bookings.png" alt="Boknings-ID:n listade via query" loading="lazy" /><figcaption>Boknings-ID:n för ett fordon.</figcaption></figure>

Jag testade att skapa en ny bokning och loggade sedan ut. Efter det placerade jag boknings-ID:et i `deleteBooking`, körde … och bokningen försvann! Jag hade hittat en Broken Access Control!

Om sårbarheten hade utnyttjats så hade vem som helst kunnat avboka alla bokningar i systemet. Företaget hade förlorat alla intäkter från bokningarna och aktiva användare hade riskerat att bli strandsatta. Jag kontaktade företaget för att göra en responsible disclosure. Deras CTO svarade och de åtgärdade buggen. De hade inget officiellt bug bounty program men jag fakturerade ett femsiffrigt belopp för samarbetet. De tackade mig för ett _“gott och etiskt samarbete”_. Ju mer skyddat ett API ser ut, desto mer sällan kollar man vad som valideras.
