# PPLM Mobile Bedside

React Native mobile companion to PPLM Pro Command, with Swift / Obj-C iOS native modules and Kotlin Android native modules. Built against UX spec v2.7.

## Repo layout

```
.
├── app/                    React Native app (TypeScript)
│   ├── src/                Application source
│   │   ├── theme/          §13 visual tokens, type ramp, severity composer
│   │   ├── components/     14 reusable building blocks
│   │   ├── screens/        Roster / Patient / Inbox / Conversation / AddBedsideData / RoutineCheck / Onboarding / VitalsTrend
│   │   ├── data/           Wire types + typed API client
│   │   ├── state/          Zustand stores (density, onboarding)
│   │   ├── native/         JS bridges to native modules
│   │   ├── privacy/        §3.2 audit primitives
│   │   └── navigation/     React Navigation root
│   ├── ios/AstaPPLM/Modules/         Swift + Obj-C native modules
│   ├── ios/AstaPPLMLiveActivity/     Live Activity widget target (Swift / WidgetKit)
│   └── android/app/src/main/java/com/astapplm/modules/   Kotlin native modules
├── server/                 Express mock REST server (TypeScript)
│   └── src/fixtures/       Bed 4 PT-9K2X across stable / watch / critical
└── scripts/                setup-native.js, audit-pii.js
```

## Setup

```bash
yarn install            # install workspace deps
yarn setup              # one-time: generates the native iOS/Android projects via the RN CLI
                        # then prints the manual finishing steps (see below)
```

After `yarn setup`, finish the iOS side once in Xcode:

1. Open `app/ios/AstaPPLM.xcworkspace`.
2. Add the **AstaPPLMLiveActivity** widget target (File → New → Target → Widget Extension; check "Embed in Containing App").
3. Set the bridging header to `app/ios/AstaPPLM/AstaPPLM-Bridging-Header.h`.
4. Merge the contents of `app/ios/AstaPPLM/Info.plist.partial` into the generated `Info.plist`.
5. Run `cd app/ios && pod install`.

Android finishing steps:

1. Merge `app/android/app/src/main/AndroidManifest.partial.xml` into the generated `AndroidManifest.xml`.
2. Add `RNAstaPackage()` to the `getPackages()` list in `MainApplication.kt`.

## Run

```bash
yarn server             # start the mock REST API on :3001
yarn ios                # in another terminal — launch the iOS simulator
yarn android            # or — launch an Android emulator
```

## Privacy audit

The product is privacy-by-architecture (spec §3.2): no patient names, MRNs, DOBs, or other PII appear on any surface. To confirm:

```bash
yarn audit:pii          # static grep across app/src and server/src
```

CI should fail the build if this command returns non-zero.

## Demo flows

- **Roster → Patient.** Tap Bed 4 from the roster.
- **Density toggle.** From the Patient header, tap `Simple ▾` and pick Detailed; the screen re-renders with sub-scores, all forecasts, and the top 3 scenarios.
- **State switching.** `POST http://localhost:3001/dev/state {"state":"watch"}` flips Bed 4 to the watch state — pull to refresh on the Patient screen.
- **Add bedside data.** From the Patient screen, scroll to "Add bedside data" → enter Lactate `2.4` → Save and rerun. Risk drops 45 → 32 with both receipts visible (score-change neutral, confidence-shift causal — §7.2).
- **Push test.** `POST http://localhost:3001/push/test {"token":"PT-9K2X","severity":"watch"}` returns the wire payload that would be sent to APNs/FCM in production.

## Spec traceability

Every component file references the spec section it implements. The acceptance criteria in §19 (36 items) form the test plan; the privacy criteria (#1–4) gate deployment.

## License

Proprietary — ASTA Healthtech.
