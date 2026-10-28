# Sheets upload UI

Mounir (26–27 Oct): the Sheets **backend** import is fine; the picker in the BOM upload modal is a mess. He asked Yusuf to take the UI. OAuth, HTS, and Ask AI stay with him.

## What it is

Same upload modal as a file. **File** | **Google Sheet**. Pick a spreadsheet, pick a tab, **Add this sheet**. That yields a CSV and goes through the existing column-mapping → analyze path. No second parser.

## What’s wrong today

- Spreadsheet names dump into a scroll list with no search.
- Tabs are wrapping chips.
- Tab fetch has no loading state, so “No tabs” flashes on every pick.
- The modal subtitle still says “Drop a CSV or Excel export” on the Sheet tab.

## Change (web only)

- Search filters the spreadsheet list.
- The selected row is obvious; show `modified_at` when the API sent it.
- Tabs use the same menu as the sourcing board picker.
- Checking, listing, tabs, and import each have a status. Never a blank list or a false empty.
- Sheet-tab subtitle: pick a spreadsheet and tab, then confirm columns like a file.

Connect still opens Settings → Integrations. Import still calls `importGoogleSheetTab`. No Google Picker. No backend change.

## Test

Component tests with mocked status / list / tabs / import. Live Google needs the stack back up (ACM + GoDaddy `api` CNAME). This PR does not deploy.

## Out of scope

OAuth callback, HTS, Ask AI, keeping Fargate up through Thursday.
