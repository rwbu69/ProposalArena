# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **API Key Tutorial Drawer:** Added a new sliding side panel (`ApiTutorialDrawer.svelte`) to provide a step-by-step tutorial on how to obtain a Google AI Studio API key.
- **Landing Page Steps:** Added three explicit onboarding steps ("Siapkan Dokumen", "Unggah File", "Mulai Simulasi") on the left panel of the landing page to better guide users.
- **i18n Support:** Added new translation strings for the landing page onboarding steps and API key tutorial in both `en.json` and `id.json`.

### Changed
- **Default AI Provider:** Updated `SettingsModal.svelte` and AI provider configurations to default to Google Gemini (`gemini`), using the `gemini-3.5-flash-lite` model, and pre-filling the required proxy URL (`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`).
- **Landing Page Navigation:** Redesigned the left panel of the landing page to match a cleaner, minimalist aesthetic. The logo and social media icons were removed, and the settings icon was repositioned alongside the language toggle.
- **File Uploader (PDF Only):** The dropzone (`FileUploader.svelte`) now strictly accepts only `.pdf` files, removing legacy support for `.txt` files. The UI text was updated to reflect this change.

### Fixed
- **FileUploader Typings:** Fixed a TypeScript warning related to `FileList` items being potentially `undefined`.
- **CSS Warnings:** Removed an unused CSS selector (`.canvas-dropzone.dragover`) from `FileUploader.svelte`.
