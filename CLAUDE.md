@AGENTS.md

# App UI Style Guide

Any UI changes in this app should follow the existing xmanager visual language unless the user explicitly asks for a redesign.

## Core Direction

- Prefer calm, operational UI over marketing-style UI.
- Keep layouts clean, structured, and dense enough for workspace workflows.
- Use rounded surfaces, soft borders, and restrained shadows rather than hard edges or heavy effects.
- Favor the existing sky-blue accent for primary actions and status emphasis.

## Color And Surfaces

- Match the app palette already defined in [app/globals.css](/root/Gad/web/Apps/xmanager/app/globals.css): soft slate background, white cards, zinc neutrals, sky primary accents.
- In dark mode, keep contrast strong but avoid pure black panels unless already present.
- Use red only for destructive actions, amber for warnings, emerald for success, and neutral zinc for secondary UI.
- New surfaces should usually look like existing cards and dialogs: rounded `2xl`, subtle border, low shadow, readable contrast.

## Typography And Spacing

- Keep using the app sans stack and the current type scale.
- Page titles should feel compact and strong, with short descriptive subtext underneath.
- Body copy and helper text should stay in muted zinc tones.
- Prefer consistent spacing rhythms like `gap-2`, `gap-3`, `gap-4`, `p-5`, and `space-y-4/5/6`.

## Components

- Reuse shared primitives in `components/ui` before creating custom styling.
- Prefer dialog-based confirmation for destructive actions instead of native browser `alert` or `confirm`.
- Buttons should follow the existing variants in [components/ui/button.tsx](/root/Gad/web/Apps/xmanager/components/ui/button.tsx).
- Cards, badges, and page headers should visually align with [components/ui/card.tsx](/root/Gad/web/Apps/xmanager/components/ui/card.tsx), [components/ui/badge.tsx](/root/Gad/web/Apps/xmanager/components/ui/badge.tsx), and [components/shared/page-header.tsx](/root/Gad/web/Apps/xmanager/components/shared/page-header.tsx).

## Interaction Rules

- Destructive actions should ask for confirmation in an app-styled modal.
- Feedback after actions should use the existing toast pattern where appropriate.
- Keep motion subtle and functional. Avoid decorative animation unless there is already precedent nearby.
- Preserve accessibility: keyboard focus states, clear labels, and readable contrast are required.

## Agent Rule

For any future UI change, agents should treat this style guide as the default and keep new UI consistent with the current app style.
