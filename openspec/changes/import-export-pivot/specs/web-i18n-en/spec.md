# Delta for web-i18n-en

## ADDED Requirements

### Requirement: Single-locale English UI

All user-facing copy in the web app MUST be presented in English under a single locale
`en`. No user-facing string MAY remain in Spanish.

#### Scenario: No Spanish copy

- GIVEN any rendered view of the app in the `en` locale
- WHEN the view is inspected
- THEN every user-facing string is English

#### Scenario: Locale is en

- GIVEN the app loads
- WHEN the active locale is resolved
- THEN the active locale is `en`

### Requirement: i18n layer over all user-facing copy

User-facing strings MUST be sourced from the i18n layer rather than hardcoded literals,
covering every previously Spanish UI surface.

#### Scenario: String resolved through i18n

- GIVEN a user-facing label
- WHEN the view renders
- THEN the label is resolved from the `en` catalog

### Requirement: Document language metadata

The served HTML document MUST declare `lang="en"` with an English title, and generated HTML
document templates MUST be English.

#### Scenario: HTML lang and title

- GIVEN the app shell loads
- WHEN the served HTML is inspected
- THEN `lang="en"` and an English title are set

### Requirement: English errors and empty states

Validation errors, empty states, and system messages MUST be shown in English.

#### Scenario: English error message

- GIVEN a form with invalid input
- WHEN submission fails
- THEN the error message is English

## Assumptions

- Scope is single-locale `en`; no locale switcher and no additional locales.
- Migration is mechanical over roughly 120-150 existing Spanish strings; landing page first,
  then app shell.
