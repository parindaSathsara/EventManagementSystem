# EventSocial UI Prototype Website

This repository now includes a requirement-driven UI prototype website for EventSocial.

## Scope covered

The prototype is aligned to the docs under `RequirementDocs/`, especially:
- `RequirementDocs/MAIN.md`
- `RequirementDocs/eventsocial_full_requirements.md`
- `RequirementDocs/Diagrams/UI UX/eventsocial_uiux_master_plan.md`
- `RequirementDocs/Diagrams/UI UX/eventsocial_design_system.md`
- `RequirementDocs/Diagrams/UI UX/eventsocial_screen_structure_spec.md`
- `RequirementDocs/Diagrams/UI UX/eventsocial_ui_tokens.json`

Prototype surfaces included:
- Customer app screens
- Artist app screens
- Admin dashboard screens
- Deep-link web preview screens

## Files

- `index.html` - Prototype website with role-based screen templates
- `styles.css` - Design-token-based styling (monochrome + `#FF5482` and `#00FFA1`)
- `app.js` - Interaction logic (role tabs, screen switching, mobile nav, reveal effects)

## Run locally

You can open `index.html` directly, but a local server is recommended.

### Option 1: Python

```bash
python -m http.server 8080
```

Then open: `http://localhost:8080`

### Option 2: VS Code Live Server

Open the folder in VS Code and run **Live Server** on `index.html`.

## Notes

- Prototype focuses on Phase 1 priorities with Phase 2-ready context.
- No customer comment UI is included by design.
- Visual direction follows the locked EventSocial design system.
