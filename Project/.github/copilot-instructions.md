# EventSocial — Copilot Coding Standards

## Requirement Documents — MUST READ

Before writing any code, always consult the following requirement and design documents in `RequirementDocs/`. These are the source of truth for all features, architecture, UI/UX, and database decisions. Follow them strictly.

| Document | Purpose |
|----------|---------|
| `RequirementDocs/MAIN.md` | Master execution handbook — overall roadmap, phases, priorities |
| `RequirementDocs/eventsocial_full_requirements.md` | Complete functional and non-functional requirements |
| `RequirementDocs/eventsocial_comprehensive_technical_design.md` | Architecture, tech stack, system design details |
| `RequirementDocs/eventsocial_pages_flow_and_assets.md` | Page flows, navigation, and asset specifications |
| `RequirementDocs/eventsocial_servers_and_domain_plan.md` | Server infrastructure and domain planning |
| `RequirementDocs/Diagrams/UI UX/eventsocial_design_system.md` | Design tokens, color palette, typography, spacing |
| `RequirementDocs/Diagrams/UI UX/eventsocial_screen_structure_spec.md` | Screen-by-screen layout and component specs |
| `RequirementDocs/Diagrams/UI UX/eventsocial_uiux_master_plan.md` | UI/UX strategy and interaction patterns |
| `RequirementDocs/Diagrams/UI UX/eventsocial_information_architecture.md` | Information architecture and content hierarchy |
| `RequirementDocs/Diagrams/UI UX/eventsocial_user_flows.mmd` | User flow diagrams (Mermaid) |
| `RequirementDocs/Diagrams/UI UX/eventsocial_ui_tokens.json` | Design token values (JSON) |
| `RequirementDocs/Diagrams/UI UX/colors.md` | Color definitions and usage |
| `RequirementDocs/Diagrams/UI UX/eventsocial_sitemap.mmd` | App sitemap (Mermaid) |
| `RequirementDocs/Diagrams/Database Design/eventsocial_database_design.md` | Database design rationale and relationships |
| `RequirementDocs/Diagrams/Database Design/eventsocial_schema.sql` | Database schema (SQL) |
| `RequirementDocs/Diagrams/Database Design/eventsocial_erd.mmd` | Entity-relationship diagram (Mermaid) |

**Rules:**
- When implementing a feature, first read the relevant requirement docs to understand the expected behavior, data models, and UI design.
- Never guess or assume requirements — always refer to these documents.
- If a requirement doc and this coding standards file conflict, the requirement doc takes priority for business logic; this file takes priority for code structure and conventions.

---

## Golden Rules

1. **Never put everything in one file.** Every component, hook, utility, and constant gets its own file.
2. **Single Responsibility.** Each file does one thing. Each function does one thing. Each component renders one concern.
3. **Reuse over duplication.** Before writing anything, check if a shared component, hook, or utility already exists. If it could be reused elsewhere, put it in `shared/`.
4. **Flat over nested.** Avoid deeply nested folder hierarchies. Two to three levels max inside any module.
5. **Explicit over clever.** Readable code wins over short code. Name things clearly. No abbreviations.

---

## Project Structure

### Mobile App (React Native / Expo)

```
Project/
├── src/
│   ├── app/                    # App entry, providers, root navigator
│   │   ├── App.jsx
│   │   ├── Providers.jsx       # All context providers wrapped here
│   │   └── navigation/
│   │       ├── RootNavigator.jsx
│   │       ├── AuthNavigator.jsx
│   │       └── MainTabNavigator.jsx
│   │
│   ├── features/               # Feature modules (domain-driven)
│   │   ├── auth/
│   │   │   ├── components/     # Auth-specific components
│   │   │   ├── hooks/          # Auth-specific hooks
│   │   │   ├── screens/        # Auth screens only
│   │   │   ├── services/       # Auth API calls
│   │   │   └── index.js        # Public exports barrel
│   │   ├── events/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── screens/
│   │   │   ├── services/
│   │   │   └── index.js
│   │   ├── reels/
│   │   ├── artists/
│   │   ├── calendar/
│   │   ├── discovery/
│   │   ├── notifications/
│   │   └── profile/
│   │
│   ├── shared/                 # Shared across all features
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── index.js       # Barrel export
│   │   ├── hooks/              # Reusable hooks
│   │   │   ├── useDebounce.js
│   │   │   ├── useLocation.js
│   │   │   └── index.js
│   │   ├── utils/              # Pure utility functions
│   │   │   ├── formatDate.js
│   │   │   ├── validation.js
│   │   │   └── index.js
│   │   ├── services/           # Shared API client, interceptors
│   │   │   ├── apiClient.js
│   │   │   └── index.js
│   │   └── constants/          # App-wide constants
│   │       ├── colors.js
│   │       ├── spacing.js
│   │       ├── typography.js
│   │       └── index.js
│   │
│   ├── theme/                  # Design tokens and theming
│   │   ├── tokens.js           # Colors, spacing, radii, shadows
│   │   ├── typography.js       # Font families, sizes, weights
│   │   └── index.js
│   │
│   └── assets/                 # Static assets
│       ├── images/
│       ├── icons/
│       └── fonts/
```

### Backend (NestJS)

```
backend/
├── src/
│   ├── main.js
│   ├── app.module.js
│   ├── modules/                # One folder per domain module
│   │   ├── auth/
│   │   │   ├── auth.module.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.repository.js
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.js
│   │   │   │   └── register.dto.js
│   │   │   ├── guards/
│   │   │   │   └── jwt-auth.guard.js
│   │   │   ├── entities/
│   │   │   │   └── user.entity.js
│   │   │   └── __tests__/
│   │   │       └── auth.service.spec.js
│   │   ├── events/
│   │   ├── reels/
│   │   ├── artists/
│   │   ├── calendar/
│   │   ├── notifications/
│   │   └── admin/
│   ├── common/                 # Shared backend code
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   ├── dto/
│   │   └── utils/
│   └── config/                 # Configuration
│       ├── database.config.js
│       ├── redis.config.js
│       └── app.config.js
```

---

## Component Rules

### 1. One component per file
```
✅  Button.jsx → exports Button
❌  Components.jsx → exports Button, Card, Modal
```

### 2. Component file structure
Every component file follows this order:
1. Imports (external → internal → styles)
2. PropTypes definition (at bottom, after component)
3. Component function
4. Styles (StyleSheet at bottom, or separate `.styles.js` for large components)

### 3. Extract reusable components aggressively
If a UI pattern appears more than once (or could), extract it to `shared/components/`. Examples:
- Buttons, inputs, cards, modals, avatars, badges, list items
- Layout wrappers (SafeArea, Screen, Container)
- Feedback components (Toast, Error, Empty state)

### 4. Compose, don't monolith
Break large screens into smaller composed components:
```
EventDetailScreen/
├── EventDetailScreen.jsx       # Screen container, data fetching
├── EventHeader.jsx             # Hero image + title
├── EventInfo.jsx               # Date, location, price
├── EventArtistCard.jsx         # Artist preview
└── EventActions.jsx            # Book / Share buttons
```

### 5. Props over internal state
Components should receive data via props. Lift state up. Only use local state for truly local UI concerns (toggle, animation, form field).

---

## Hook Rules

1. **Custom hooks for logic extraction.** If a component has more than ~15 lines of non-JSX logic, extract it to a custom hook.
2. **One hook per file.** Named `use<Purpose>.js`.
3. **Feature hooks** go in `features/<name>/hooks/`. **Shared hooks** go in `shared/hooks/`.
4. **Hooks never return JSX.** They return data and callbacks only.

---

## Styling Rules

1. Use `StyleSheet.create()` for all styles — never inline style objects.
2. Reference design tokens from `theme/tokens.js` for colors, spacing, radii, and typography.
3. For components with more than ~30 style rules, use a separate `<Component>.styles.js` file.
4. Never hardcode color hex values in components. Always import from the theme.

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Components | PascalCase | `EventCard.jsx` |
| Hooks | camelCase with `use` prefix | `useEventDetails.js` |
| Utilities | camelCase | `formatDate.js` |
| Constants | UPPER_SNAKE_CASE | `MAX_REEL_DURATION` |
| Services | camelCase | `eventService.js` |
| Screens | PascalCase with `Screen` suffix | `EventDetailScreen.jsx` |
| Navigators | PascalCase with `Navigator` suffix | `MainTabNavigator.jsx` |

---

## Import Rules

1. **Barrel exports** (`index.js`) in every `components/`, `hooks/`, `utils/`, `services/` folder.
2. **Import order** (enforced):
   - External packages (`react`, `react-native`, third-party)
   - Internal absolute paths (`@/shared/`, `@/features/`, `@/theme/`)
   - Relative imports (`./`, `../`)
3. **Never use deep imports** into another feature. Import from the feature's `index.js` barrel.
   ```
   ✅  import { EventCard } from '@/features/events';
   ❌  import { EventCard } from '@/features/events/components/EventCard';
   ```

---

## API & Services Rules

1. **One service file per domain** — `eventService.js`, `authService.js`.
2. **All API calls go through `shared/services/apiClient.js`** — never call `fetch` or `axios` directly in components.
3. **Services return structured data** — use JSDoc comments to document response shapes.
4. **Keep request/response shapes documented** — use JSDoc `@typedef` or inline comments for clarity.

---

## Documentation & PropTypes

1. **Use `PropTypes`** for runtime prop validation on every component.
2. **Use `defaultProps`** where sensible defaults exist.
3. **Use JSDoc comments** (`@param`, `@returns`, `@typedef`) to document function signatures, service responses, and complex data shapes.
4. **Keep JSDoc lightweight** — document "what" not "how". Skip obvious parameters.

---

## File Size Limits

- **Components:** Max ~150 lines. If larger, extract sub-components or hooks.
- **Hooks:** Max ~100 lines. If larger, compose from smaller hooks.
- **Services:** Max ~200 lines. If larger, split by sub-domain.
- **Utility files:** Max ~100 lines. One concern per file.

If any file approaches these limits, break it down before it gets unwieldy.

---

## What NOT to Do

- ❌ Dump all components in a single `components/` folder with no grouping
- ❌ Put API calls directly in components
- ❌ Create "god components" that do everything
- ❌ Use inline styles or hardcoded colors
- ❌ Mix feature concerns (e.g., auth logic inside event components)
- ❌ Skip PropTypes on components that accept props
- ❌ Create files with multiple exported components
- ❌ Copy-paste code instead of extracting shared utilities
- ❌ Nest folders more than 3 levels deep
- ❌ Leave dead code, commented-out blocks, or TODO-without-issue-links

---

## Reference Documents

See the full table of requirement documents in the **"Requirement Documents — MUST READ"** section at the top of this file. Always consult them before implementing any feature.
