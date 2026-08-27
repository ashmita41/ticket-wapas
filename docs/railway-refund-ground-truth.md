# Ticket Wapas: railway counter-ticket refund ground truth

Research date: 27 August 2026  
Purpose: product and prototype decisions, not legal advice or an operational Railway circular.

## Executive product decisions

1. **Do not treat every counter ticket as a PNR ticket.** The first deterministic decision is ticket type: reserved PRS or unreserved UTS.
2. **Keep reserved PRS as the primary story, with a correct UTS branch.** A synthetic train-specific UTS ticket may complete special cancellation; an ordinary route ticket must stop for the alternate-service check.
3. **Recognise UTS/general tickets and route them correctly.** Do not reject them as “not a ticket,” ask for a PNR, use booking-mobile OTP, or promise a train-cancellation refund without the special-cancellation condition.
4. **A ticket photo is an input, not proof of ownership.** AI may classify and extract; official records and deterministic rules decide eligibility.
5. **Prefer refund to the original payment source.** Ask for a new UPI/bank destination only for cash-paid tickets or a documented failure of the original route.
6. **Do not auto-pay when the booking mobile is unavailable, the original ticket cannot be proven, the train was cancelled and restored, or payment ownership does not match.** Create an assisted-review reference instead.
7. **The citizen journey should be the homepage.** Research, statistics, rules, architecture and source material belong on secondary pages.
8. **Use the UX4G/GIGW interaction language, not Government marks.** Familiar form patterns, hierarchy, accessibility, Hindi and provenance create trust. The State emblem or Railway logo would falsely imply official status.

## 1. Counter-ticket taxonomy

| Property | Reserved PRS counter ticket | Unreserved/general UTS ticket |
|---|---|---|
| What it buys | A reserved seat/berth, RAC position or waiting-list position for a specific train and journey | Travel authority for a route/class/time window; ordinarily no allocated seat or berth |
| Main system | Passenger Reservation System (PRS) | Unreserved Ticketing System (UTS) |
| PNR | Yes: 10 digits | No |
| Other ticket identifier | 8-digit ticket number and authenticity/random fields | 10-character alphanumeric UTS number, 8-digit stationery number and a random number |
| Train linkage | Specific train number and date | Ordinary UTS journey tickets are generally not specific to one train; special products can be |
| Passenger record | PRS record contains passenger and reservation details | No named reserved accommodation; ticket records passenger count, route, class and fare |
| Refund proof risk | PNR is discoverable and is not sufficient proof by itself | Paper can be copied and there is no named berth/passenger link, so original-ticket control is especially important |

Official Railway training material says a computerised reserved ticket carries a 10-digit PNR on the upper left and an 8-digit ticket number on the upper right, along with train, stations, class, fare, passenger count, age/gender, berth/RAC/WL status, date, issue time, counter and random number. The same material says a UTS ticket contains a 10-character alphanumeric UTS number used for cancellation/special cancellation, an 8-digit stationery number, stations, class, date, passenger count, fare, route, issue time, counter/window and a random number.

### Correction to the original assumption

“General tickets only have a ticket number” is directionally right about **no PNR/seat**, but incomplete. A UTS ticket has multiple identifiers. Ticket Wapas must look for the alphanumeric UTS number rather than forcing a PNR.

## 2. How a reserved counter ticket is issued

The official reservation/cancellation requisition form asks for:

- train number and name;
- journey date and class;
- origin, destination, boarding point and reservation-up-to station;
- up to six passengers, with name, sex, age and concession/travel-authority details;
- berth/seat preference and, where relevant, meal preference;
- applicant name, address, signature and telephone number.

The reservation clerk enters the request into PRS, the system assigns CNF/RAC/WL status, calculates the fare, records the payment and prints the physical ticket. The ticket should be checked before leaving the window.

Payment at a counter may be cash, debit/credit card or UPI/BHIM. For UPI, the clerk enters the passenger's VPA, the passenger approves the collect request and the ticket is printed only after the system receives a successful payment response.

### Product fields we need from the authoritative record

- ticket channel: PRS counter / UTS counter / e-ticket;
- PNR or UTS number;
- ticket number and authenticity fields;
- train number and journey date where applicable;
- boarding and destination stations;
- CNF/RAC/WL/current status;
- passenger/applicant record;
- booking mobile, if supplied;
- payment mode and original payment reference;
- current cancellation/refund state;
- authoritative train-event state.

The prototype may mock these fields, but it must label them as mocked and must not imply that a public, documented API currently exposes them.

## 3. Current PRS counter-ticket cancellation flow

### Normal voluntary cancellation

Current IRCTC counter-ticket cancellation requires PNR, train number and CAPTCHA. An OTP is sent to the mobile supplied at booking. After validation, PRS details and the refundable amount are shown.

However, online/139 cancellation **does not finish the refund**:

1. PRS marks the PNR cancelled but not refunded.
2. The seat/berth is released.
3. The passenger receives the refundable amount and collection instruction.
4. The original ticket still has to be surrendered at an eligible PRS counter within the applicable time.

The online/139 facility applies only where a valid booking mobile exists and is explicitly described as a normal-circumstances facility, not the path for late-running or cancelled-train cases.

### Normal refund timing and deduction

| Ticket state | Latest normal action | Refund treatment |
|---|---|---|
| Confirmed, more than 48 hours before departure | Cancel/surrender | Flat per-passenger deduction: ₹240 1A/Executive, ₹200 2A/First, ₹180 3A/3E/CC, ₹120 Sleeper, ₹60 Second Sitting; GST applies where specified |
| Confirmed, 48 to 12 hours | Cancel/surrender | 25% of fare, subject to the minimum flat charge |
| Confirmed, 12 to 4 hours | Cancel/surrender | 50% of fare, subject to the minimum flat charge |
| Confirmed, later than 4 hours before scheduled departure | Normal refund not admissible | Exception/manual rules may still apply if the reason is a Railway disruption |
| RAC or waitlisted | Up to 30 minutes before scheduled departure | Fare less clerkage, currently ₹60 per passenger plus GST for AC classes |
| RAC/WL after the 30-minute cut-off | Normal refund not admissible | Do not promise a refund |
| RAC/WL upgraded to confirmed by final chart | Confirmed-ticket rules apply | Recalculate from current status, not booking status |

Fully waitlisted **e-tickets** are dropped from the chart and refunded electronically. A fully waitlisted **physical PRS counter ticket** is not equivalent: the passenger must deposit the physical ticket within the prescribed time to obtain the refund.

## 4. Railway-disruption eligibility matrix

The product must distinguish “the passenger changed plans” from “Railways did not provide the booked service.”

| Situation | Ground-truth outcome | Ticket Wapas decision |
|---|---|---|
| Train officially marked fully cancelled | Full fare for PRS counter ticket when original ticket is surrendered within three days, excluding the scheduled departure day | Eligible after authoritative cancellation status, original-ticket/ownership proof and duplicate-refund check |
| Train more than three hours late at the passenger’s boarding station; passenger does not travel | Full fare, without cancellation charge/clerkage, if the counter ticket is surrendered by actual departure | Eligible only before actual departure and only after official delay data; after departure, manual/no-refund result according to rule |
| Railway cannot provide reserved accommodation | Full fare if ticket is surrendered within three hours of actual departure | Eligible, but verify final accommodation status |
| Train diverted; does not touch boarding or destination; passenger does not travel | Exceptional claim/TDR rules and deadlines apply | Assisted/manual-review path; do not calculate automatically without authoritative event and rule integration |
| Train terminated short before journey starts | Exceptional claim/TDR path | Assisted/manual review |
| Journey already started and is terminated/dislocated | Depending on alternative transport offered, full fare or the untravelled portion may be refundable; station certificate/TDR may be required | Separate “journey already started” flow; never show the normal full-refund screen |
| AC failed or passenger travelled in lower class | Difference of fare, with checking-staff certificate and deadline | Out of MVP; explain and hand off to the correct claim route |
| Passenger simply missed the train | Not a Railway cancellation | Not eligible through Ticket Wapas |
| Train temporarily shown cancelled and later restored | Final official status controls; no safe automatic promise | Keep claim pending or send to manual review until cancellation state is final |
| Confirmed Tatkal/Premium Tatkal voluntarily cancelled | Normally no refund | Not eligible under normal cancellation |
| Tatkal train cancelled or >3 hours late and passenger does not travel | Railway-disruption exceptions can permit full refund | Evaluate disruption reason, not quota label alone |
| Some passengers on one PNR travel and others do not | Partial/party-ticket rules; certificate/TDR can be required | Manual/assisted path in MVP |
| Duplicate ticket, circular journey, foreign-tourist allocation, cluster/pre-bought ticket or other excluded product | Online counter-ticket cancellation has explicit exclusions/special rules | Detect and hand off; never silently treat as a standard PNR |
| Lost/misplaced physical reserved ticket | No refund for the lost/misplaced ticket under the published rule | Do not auto-refund |
| Torn/mutilated ticket | Refund can be considered if genuineness/authenticity is verifiable | Assisted review |

## 5. UTS/general tickets are a separate rules engine

An ordinary unreserved ticket is not associated with a reserved seat or berth. Railway training material states that UTS tickets can ordinarily be cancelled:

- within three hours of issue for a same-day non-suburban ticket;
- by midnight on the day before travel for an advance ticket;
- within one hour in specified suburban/printed-mobile-ticket situations;
- after deduction of clerkage.

The key ground reality is that an ordinary UTS ticket is generally route/class based, so cancellation of one train does not necessarily remove the passenger’s ability to take another permitted train. Railway training material describes “UTS special cancellation” for limited cases such as:

- only one train serving the section/destination, or one morning and one evening service; or
- a ticket actually issued for a specific train, such as specified Jan Shatabdi/Double Decker cases.

Therefore Ticket Wapas must not show “full refund available” to a UTS holder merely because one train number is cancelled.

### UTS prototype behaviour

1. Detect or let the citizen select “General/UTS ticket — no PNR.”
2. Extract UTS number, stations, class, issue date/time, passenger count and fare.
3. Read the train number only when printed. If none is printed, treat it as an ordinary route ticket and require an authorised alternate-service check.
4. Show one of:
   - normal unused-ticket cancellation window;
   - possible special cancellation, needs authorised verification;
   - not eligible because the normal window expired/another train remains available;
   - assisted review because service disruption details are inconclusive.

For the competition prototype, the synthetic train-specific UTS sample completes possession proof, simulated irreversible UTS cancellation and payout. An ordinary route-based UTS ticket creates a clearly labelled verification reference and does not start a refund.

## 6. How refund destination verification should work

### First principle: original source before new account

| Booking payment mode | Preferred refund route |
|---|---|
| Cash | Cash under today's counter process; in the proposed digital flow, collect a verified UPI/bank destination |
| Debit/credit card through POS | Original cardholder account; Railway guidance says no cash refund and describes credit back to the cardholder account |
| UPI/BHIM at counter | Original UPI-linked payment source when the payment reference is available; no cash refund |
| E-ticket | Original account/payment source; already automatic for fully cancelled trains |

The current prototype's unconditional “choose UPI or bank account” step is therefore too broad.

### Proposed destination checks for cash-paid tickets

#### UPI

1. Citizen enters a VPA or selects a verified UPI destination.
2. The authorised payment integration calls UPI Validate Address.
3. The system receives and displays the ultimate beneficiary/CBS name, not a user-editable QR nickname.
4. Citizen confirms the masked VPA and returned name.
5. The claim engine checks whether the claimant is an authorised recipient under the product policy.

NPCI requires the ultimate beneficiary banking name returned by the Validate Address API to be displayed for UPI P2P/P2PM transactions.

#### Bank account

1. Citizen enters account number twice and IFSC.
2. The authorised banking/payment integration performs beneficiary-name lookup.
3. The bank returns the account name from Core Banking Solution and a lookup reference.
4. The interface shows the returned name and masked account number for confirmation.
5. The service stores the lookup reference and audit result, not unmasked data in analytics/logs.

RBI directed NEFT/RTGS member banks to offer account-name lookup by 1 April 2025. The lookup is based on account number and IFSC, should be free to customers, must produce logs/reference data at the banks and must comply with privacy requirements.

### Name match is not enough

A counter ticket may contain multiple passengers; the applicant, payer and traveller may be different family members. Therefore:

- a green “verified” badge must mean only “the payment address exists and this is the bank-returned name”;
- it must not mean “this person legally owns the refund”;
- automatic payout requires a documented recipient policy, booking-mobile verification and original-ticket control;
- a legitimate name mismatch must go to assisted review rather than immediate rejection;
- Aadhaar, PAN, bank password and UPI PIN are not required and must never be collected.

### Payment failure states

The citizen journey needs simple recovery for:

- invalid or inactive VPA;
- account/IFSC lookup unavailable;
- beneficiary name mismatch;
- closed, frozen or ineligible account;
- payment pending;
- bank rejection;
- duplicate button taps;
- refund returned after credit failure.

Citizen copy should say what happened, whether money moved, what to do next and the claim reference. Technical retry/idempotency detail belongs in architecture documentation.

## 7. Ownership and fraud controls

PNR, train number and a photograph are not secrets. A safe production design needs layered proof:

1. authoritative ticket lookup;
2. original-ticket possession/surrender or an approved digital equivalent;
3. booking-mobile OTP where available;
4. payment-source linkage where the ticket was paid digitally;
5. duplicate cancellation/refund state from PRS/UTS;
6. claimant/beneficiary policy for cash-paid and group tickets;
7. assisted verification where one layer is missing.

The “no longer have this booking number” flow should create a help request. It must not unlock payment merely because the citizen knows PNR and journey details.

## 8. Authoritative train and eligibility data

Citizens can currently consult NTES and 139 for train-running, cancelled, partially cancelled, diverted and rescheduled information. The official PNR enquiry shows reservation/current status and train status.

A production Ticket Wapas service would need documented, authorised integrations for:

- final PRS PNR/ticket state;
- NTES train-event state for the exact date and boarding segment;
- cancellation/refund rules and deadlines;
- ticket payment mode/reference;
- cancellation/refund ledger and duplicate prevention;
- UPI/bank validation and payout status.

There is no basis for presenting an undocumented public API or scraped NTES page as production architecture. The prototype should use deterministic synthetic responses and show an integration boundary diagram in the submission.

## 9. Mobile-first citizen information architecture

### Homepage: service first

The first mobile viewport should contain only:

- compact Ticket Wapas identity;
- “Independent prototype — not a Government website”;
- language selection;
- heading: “Refund for a paper railway ticket”;
- one short outcome-focused sentence;
- primary action: **Start refund journey**;
- small note: “Use synthetic data in this prototype.”

After **Start refund journey**, the ticket-input screen should offer:

- primary action: **Take or upload ticket photo**;
- secondary action: **Enter ticket details**.

Do not place statistics, the full problem explanation, trust claims, architecture or a large illustration before the first action.

### Journey

1. Add ticket.
2. Confirm detected type: “Reserved ticket with PNR” or “General/UTS ticket without PNR.”
3. Check editable ticket details.
4. Check official/simulated train event and current ticket status.
5. Show a decision with reason and deadline.
6. Verify ownership.
7. Route refund to original source, or validate a new destination only when needed.
8. Final confirmation.
9. Receipt, status and next action.

### Secondary pages

- How it works
- Ticket types: PNR vs UTS
- Refund rules and deadlines
- Help and exceptional cases
- Safety and privacy
- About the prototype and official sources

### Government-service feel without impersonation

Use UX4G/GIGW patterns:

- mobile-first responsive layout;
- visible bilingual selection and complete translations;
- large touch targets, native inputs and clear focus states;
- one question per step;
- plain-language validation and error recovery;
- progress and back navigation;
- a formal blue/white service palette with restrained saffron/green accents;
- source/date labels and a clear help route;
- WCAG 2.1 AA semantics and screen-reader support.

Do not use the State emblem, Indian Railways logo, official-looking approval seals or wording that suggests operation by Government.

## 10. Questions judges may ask

### Does every counter ticket have a PNR?

No. Reserved PRS tickets have a 10-digit PNR and an 8-digit ticket number. General/unreserved UTS tickets have no PNR, but carry an alphanumeric UTS number and other ticket/authenticity fields.

### Is a general ticket connected to a cancelled train?

Usually not to one train. It is generally a route/class travel authority. Special cancellation needs evidence that the ticket/service was train-specific or that no usable alternative service existed.

### Why can the existing IRCTC counter-ticket website not solve this already?

It can cancel an eligible PRS counter ticket in normal circumstances using booking-mobile OTP, but the PNR is marked cancelled-not-refunded and the passenger must still surrender the original ticket at a counter. The same online path excludes late-running and train-cancellation circumstances.

### Can AI approve the refund?

No. AI only classifies the document and extracts candidate fields. An authorised record and deterministic rules establish ticket state, train event, deadline and amount.

### Why is the original ticket important?

It is the current control against duplicate claims and proves possession of the physical travel authority. A production digital alternative would require Railway-authorised cancellation and ledger integration.

### How do you know the train is cancelled?

Production would use an authorised PRS/NTES event for the specific train, date and journey segment. The prototype uses clearly labelled synthetic data and never scrapes or modifies a live Railway system.

### Why not always refund to a new UPI ID?

Digital counter payments already have an original source and returning money there is safer. A new destination increases wrong-credit and fraud risk, and is needed mainly for cash-paid tickets or a documented failed original route.

### What if the booking mobile is gone?

The citizen receives an assisted-verification reference. The service does not bypass ownership verification.

### What if a ticket has multiple passengers?

The claim must identify whether all or only some passengers are affected. Partial travel/cancellation can require different calculations and certificates, so it goes to a dedicated/manual path in the MVP.

### What if the train was cancelled and restored?

Do not promise a refund until the authoritative event is final. A restored or conflicting status is held for manual review.

## 11. Known implementation questions requiring Railway partnership

These should be presented as integration questions, not hidden assumptions:

- Which documented service exposes final PRS ticket/cancellation/refund state to an authorised citizen service?
- Which event marks a train cancellation as final, including cancellation-restoration handling?
- Does the PRS record expose counter payment mode and an original UPI/POS refund reference consistently nationwide?
- What is the approved digital equivalent of surrendering/cancelling the original physical ticket?
- What is the authorised ownership SOP where no valid booking mobile exists?
- Who is legally entitled to nominate a refund destination on a multi-passenger, cash-paid ticket?
- How is UTS special cancellation determined across zones and train-specific products?
- Has the announced 2026 “cancel counter tickets from any station” reform been operationalised nationwide and incorporated into current system rules?

## 12. Legal integration and honest prototype-disclosure plan

### What can be integrated legally today

There is no publicly documented service that authorises an unaffiliated application to read and change the complete PRS counter-ticket cancellation/refund record. Public PNR and NTES enquiry surfaces are useful to citizens, but they are not a licence to scrape personal records or execute refunds.

CRIS does operate internal integrations between PRS, NTES, COA and Railway products. RailMadad, for example, can fetch PRS passenger details and NTES journey information after the complainant provides a PNR. Indian Railways also describes an API gateway named Pravah that is used for approved Government and travel-partner integrations. These facts establish that the required integration is technically possible, but access must be granted by the Railway data owner.

The legal production route is therefore:

1. submit the citizen-service use case and data-flow/privacy assessment to Railway Board/CRIS;
2. obtain written approval for the precise PRS, NTES/COA, payment-mode and refund-ledger operations;
3. integrate through the Railway-authorised gateway or an approved Government channel such as API Setu if Railway publishes/grants the relevant service there;
4. complete security testing, data minimisation, consent, audit logging, India-hosting and retention controls required by the publisher;
5. use an RBI-regulated bank/payment partner for beneficiary validation and disbursement rather than holding or moving passenger funds ourselves;
6. pilot with one Railway/zone before national rollout.

IRCTC's Principal Service Provider web-services programme is designed for authorised e-ticket booking providers. It should not be presented as proof that a counter-ticket refund API is available.

### Resolution of the seven open questions

| Question | What the published evidence supports | Production decision | Prototype behaviour |
|---|---|---|---|
| Which service exposes final PRS ticket/refund state? | PRS is the authoritative reservation/refund system and CRIS products integrate with it, but no public counter-refund transaction API is documented | Seek a Railway Board/CRIS gateway integration with least-privilege operations: read ticket state, place cancellation/claim, read refund ledger | Use a signed synthetic scenario adapter; display “Simulated Railway record” |
| How is cancellation/restoration finalised? | COA operational changes feed NTES; refund guidance uses a train marked cancelled in PRS. A public finality/event contract is not documented | Consume versioned authorised events, store source/time/version, and hold payment whenever PRS/NTES conflict or a later restoration exists. A sensible proposed control is to authorise payout after scheduled departure, mirroring the current e-ticket auto-refund timing, but Railway must approve it | States: checking, cancelled but awaiting final check, restored/not eligible, final simulated cancellation, manual review |
| Is counter payment mode consistently available? | PRS/POS workflows can identify the POS bank used, and UPI booking succeeds only after system-confirmed payment. Accounts guidance separately reconciles POS/UPI refunds | Require payment mode and original transaction reference in the approved response; never infer from ticket appearance. If missing, route to assisted review | Mock cash/card/UPI explicitly; show “Original payment method found” only in relevant scenarios |
| What replaces original paper surrender? | Nothing in the published current process: even after online/139 cancellation, the original paper ticket must be surrendered for refund/accountal | Proposed digital surrender: a fresh one-time photo adds possession evidence, then an authorised PRS write irreversibly cancels the ticket, blocks travel/duplicate refund and issues a receipt. Railway approval and a rule/process change are required; the photo alone never voids the ticket | Let the citizen complete this proposed digital journey end to end. Clearly simulate the photo match and authoritative cancellation response, and state that no live Railway record was changed |
| What if the booking mobile is unavailable? | Online/139 cancellation requires the booking mobile. Counter and exceptional-refund procedures rely on the original ticket; some exceptional procedures require a booked person to appear with identity proof | Assisted verification: original ticket plus a named adult passenger/applicant and approved identity/declaration at an authorised point. No instant remote payout from PNR/photo alone | Create a help reference and complete a simulated assisted-verification appointment; do not ask for real Aadhaar/PAN |
| Who receives a multi-passenger cash refund? | Published rules describe party/partial eligibility, but do not publish a clear national rule allowing an arbitrary digital nominee for a cash-paid counter ticket | Prefer recorded payer/applicant if available. Otherwise require a Railway-approved lead-claimant rule: one named adult passenger, whole-PNR declaration and one destination; partial, minor, deceased or disputed claims go to manual review | Full synthetic group claim can select one named adult lead claimant; partial/group exception is clearly sent to review |
| How does UTS special cancellation work across zones? | Official training describes UTS “special cancellation” option 13 for >3-hour delay/cancellation when only one practical service exists or the ticket is train-specific. Special cancellation is recorded and requires competent-authority control | Integrate with UTS plus the local duty/station approval workflow and a versioned zone/circular rules catalogue; do not assume every cancelled train qualifies | Complete a clearly labelled synthetic train-specific UTS sample; create a verification reference, not a refund, for an ordinary route ticket |

### Citizen-facing explanation

The main journey should show only the current citizen question. A secondary **How we verify this** drawer/page can show:

1. **Ticket checked** — type and details matched to a Railway record.
2. **Train status checked** — correct train, date and boarding segment checked for cancellation, restoration, delay or diversion.
3. **Refund rule applied** — deadline and refundable amount calculated from published rules.
4. **Ticket holder checked** — booking mobile/original ticket or assisted verification used to prevent duplicate claims.
5. **Refund destination checked** — original payment source preferred; new account verified only for cash or failed-source cases.

Every prototype result must include one concise disclosure: **“Prototype demonstration: Railway, OTP and payment responses on this screen are simulated.”** Detailed architecture belongs on the About/How it works page, not in the citizen form.

### Sources for the integration position

- [CRIS RailMadad integration with PRS and NTES](https://cris.org.in/loadpage?page=proSHLP)
- [CRIS Control Office Application integration feeding NTES](https://cris.org.in/loadpage?page=proCOA)
- [Indian Railways year book: Pravah API gateway and approved partner integrations](https://indianrailways.gov.in/railwayboard/uploads/directorate/stat_econ/2023/PDF%20Year%20Book%202021-22-English.pdf)
- [CRIS NTES exceptional-train and contact information](https://cris.org.in/loadpage?page=proNTES)
- [API Setu approval-based API subscription model](https://docs.apisetu.gov.in/document-central/explore-apisetu/Overview.html)
- [IRCTC PSP policy for authorised e-ticketing providers](https://contents.irctc.co.in/en/Policy_for_e-ticketing_Service_Providers-2013.pdf)
- [Official counter-ticket online/139 process and original-ticket surrender requirement](https://www.operations.irctc.co.in/ctcan/SystemTktCanLogin.jsf)
- [Ministry of Railways POS counter-ticket refund and reconciliation process](https://www.pib.gov.in/newsite/PrintRelease.aspx?lang=2&reg=48&relid=157554)
- [Indian Railway Accounts Code: POS/UPI cancellation is not refunded in cash](https://indianrailways.gov.in/railwayboard/uploads/codesmanual/IRAC_II.pdf)
- [Official UTS special-cancellation training material](https://scr.indianrailways.gov.in/cris/uploads/files/1663215899297-Coaching%20Theory-April%202022.pdf)

## Primary sources

- [Current IRCTC counter-ticket cancellation procedure](https://www.operations.irctc.co.in/ctcan/SystemTktCanLogin.jsf)
- [Railway Passengers (Cancellation of Tickets and Refund of Fares) Rules, 2015](https://contents.irctc.co.in/en/Refundrule2015.pdf)
- [IRCTC refund and cancellation rules, January 2026](https://contents.irctc.co.in/en/RefundCancellationRules.pdf)
- [Official Railway PRS reservation/cancellation requisition form](https://scr.indianrailways.gov.in/cris/uploads/files/1359527784660-res_form.pdf)
- [Official Railway training material: PRS/UTS ticket fields and processes](https://cr.indianrailways.gov.in/cris/uploads/files/1553600779866-Coaching%20Theory%20English.pdf)
- [Official Railway training material: UTS special cancellation](https://scr.indianrailways.gov.in/cris/uploads/files/1663215899297-Coaching%20Theory-April%202022.pdf)
- [Ministry of Railways comparison of PRS counter and e-ticket refunds](https://www.pib.gov.in/newsite/PrintRelease.aspx?lang=2&reg=48&relid=148657)
- [Ministry of Railways: counter booking through UPI/BHIM](https://www.pib.gov.in/newsite/PrintRelease.aspx?lang=2&reg=48&relid=174010)
- [Ministry of Railways: POS counter-ticket refund procedure](https://www.pib.gov.in/PressReleasePage.aspx?PRID=1480909&lang=2&reg=48)
- [Official Indian Railway PNR enquiry and status definitions](https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?locale=en)
- [Official RailMadad/UTS FAQs](https://railmadad.indianrailways.gov.in/madad/feedback.jsp)
- [RBI beneficiary bank-account name lookup circular](https://www.rbi.org.in/scripts/NotificationUser.aspx?Id=12759)
- [NPCI beneficiary-name verification for UPI](https://www.npci.org.in/uploads/UPI_OC_No_101_A_FY_2025_26_Strengthening_beneficiary_name_verification_and_display_during_UPI_transactions_eb7bd7ed72.pdf)
- [GIGW 3.0: Government website/app guidelines](https://guidelines.india.gov.in/gigw3/)
- [UX4G Government of India design system](https://www.ux4g.gov.in/get-started/about-ux4g)

## Ground-reality signals, not policy sources

Passenger reports repeatedly describe uncertainty about whether a cancellation is final, confusion between e-ticket and counter-ticket refunds, being told to revisit a counter after online cancellation, and long/manual TDR handling. These reports validate the usability problem but must never override the rules above:

- [Passenger discussion: physical ticket after train cancellation](https://www.reddit.com/r/indianrailways/comments/1dn11py/my_train_got_cancelled_how_can_i_get_my_refund/)
- [Passenger discussion: online cancellation of a physical counter ticket](https://www.reddit.com/r/indianrailways/comments/1fj1efn/has_anyone_cancelled_the_counterphysical_ticket/)
- [Passenger discussion: manual TDR for a late counter-ticket journey](https://www.reddit.com/r/indianrailways/comments/1gfwi8s/counter_ticket_refund/)
- [Passenger discussion: inconsistent cancellation/restoration information](https://www.reddit.com/r/indianrailways/comments/1hwaw6k/train_cancelled_one_month_prior_what_to_do/)
