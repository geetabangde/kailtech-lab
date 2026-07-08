# Dynamic Column Addition in Calibration Settings

We will implement the dynamic column feature in `AddCalibration.jsx` (the settings/preview screen) and ensure that `CalibrateStep3.jsx` dynamically submits the data for these new columns.

## Proposed Changes

### `AddCalibration.jsx`
- **State variables**: Add state for the Add Column modal (`isAddColumnModalOpen`, `newColumnName`, `newColumnType`, `summaryTypeOptions`).
- **Fetch Types**: Fetch options from `/observationsetting/get-all-summary-type`.
- **UI**: Add an "Add Column" button near the "Edit Headers" button above the preview table.
- **Modal**: Render a modal with a text input for Heading Name and a select dropdown for Type.
- **Layout Update**: When saved, append a new column object to `customLayout.columns`. We will use the selected `Type` as the `column_key` so that the backend correctly identifies the type, and `Heading Name` as the `headerName`/`display_name`.

### `CalibrateStep3.jsx`
- **Dynamic Submission**: In the `handleSubmit` loop, we will iterate over `customLayout.columns`. For columns that are not part of the standard template (we can identify them if they have a specific prefix or simply if they exist in `customLayout` but aren't covered by the hardcoded indices), we will pull their values from `tableInputValues` and append them to the `calibrationPoints`, `types`, `repeatables` (as `'0'`), and `values` arrays. 

## Open Questions

> [!IMPORTANT]
> The backend `save-formate-layout` accepts `column_key`, `display_name`, `sort_order`, and `group_name`. Is it acceptable to save the selected `Type` (e.g. `ambienttemp`) directly as the `column_key` for these dynamically added columns? This will allow `CalibrateStep3` to easily know the `type` when submitting observation data.
