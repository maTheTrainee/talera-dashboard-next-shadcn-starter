# Form & Wizard Blueprints (Preserved Atoms)

Atomic layouts preserved from the template's `examples` feature BEFORE running
`scripts/cleanup.js examples`, per the Talera refactor pipeline contract:

- `multi-step-product-form.tsx` — 3-step wizard skeleton (TanStack Form + `useFormStepper`),
  direct ancestor of the Ringkampanjer campaign setup wizard.
- `advanced-form-patterns.tsx` — composable patterns: array fields, cross-field Zod
  validation, listener side-effects, linked selects.
- `sheet-product-form.tsx` — Sheet-dialog form anatomy for create/edit flows.
- `demo-form.tsx` — full shadcn TanStack Form field anatomy, including the
  `FileUploadField` drag & drop usage (CSV prospect upload dropzone).

Supporting atoms that survive cleanup in place:
- `src/components/forms/fields/file-upload-field.tsx` + `src/components/file-uploader.tsx`
  (react-dropzone upload handlers)
- `src/hooks/use-stepper.tsx` (stepper state machine — restored post-cleanup)

Reference blueprints for the Phase 2 campaign feature build:
CSV prospect upload dashboard + "Ladda ner CSV-mall" download trigger.
