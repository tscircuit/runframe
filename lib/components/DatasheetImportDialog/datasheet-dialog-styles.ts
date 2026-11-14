export const datasheetDialogStyles = `
.rf-datasheet-overlay {
  z-index: 1000 !important;
  background: rgba(24, 24, 27, 0.32) !important;
  animation: none !important;
  transition: none !important;
}
.rf-datasheet-dialog {
  z-index: 1001 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 0 !important;
  width: min(800px, calc(100vw - 40px)) !important;
  max-width: none !important;
  height: min(650px, calc(100dvh - 48px));
  max-height: none !important;
  padding: 0 !important;
  overflow: hidden;
  border: 1px solid #dedee3 !important;
  border-radius: 10px !important;
  color: #18181b;
  background: #fff !important;
  font: 13px / 1.5 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  box-shadow: 0 20px 60px #0002 !important;
  animation: none !important;
  transition: none !important;
}
.rf-datasheet-dialog * {
  box-sizing: border-box;
}
.rf-datasheet-dialog button,
.rf-datasheet-dialog select {
  font-family: inherit;
}
.rf-datasheet-dialog button:focus-visible,
.rf-datasheet-dialog select:focus-visible,
.rf-datasheet-dialog input:focus-visible {
  outline: 2px solid #71717a;
  outline-offset: 3px;
}
.rf-datasheet-dialog .ds-header {
  height: 65px;
  flex: none;
  padding: 0 23px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e4e4e7;
}
.rf-datasheet-dialog .ds-header h2 {
  font-size: 15px !important;
  line-height: 24px;
  font-weight: 600;
  letter-spacing: -.15px;
  margin: 0;
}
.rf-datasheet-dialog .ds-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #71717a;
  cursor: pointer;
  flex: none;
}
.rf-datasheet-dialog .ds-icon-button:hover {
  background: #f4f4f5;
  color: #18181b;
}
.rf-datasheet-dialog .ds-icon-button:disabled {
  opacity: 0.4;
  cursor: default;
}
.rf-datasheet-dialog .ds-controls {
  flex: none;
  padding: 19px 23px 15px;
}
.rf-datasheet-dialog .ds-upload {
  height: 54px;
  border: 1px solid #dedee3;
  border-radius: 6px;
  background: #fff;
}
.rf-datasheet-dialog .ds-upload[data-dragging="true"] {
  background: #f4f4f5;
  border-color: #71717a;
}
.rf-datasheet-dialog .ds-upload-trigger {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  text-align: left;
  border: 0;
  background: none;
  border-radius: 5px;
  cursor: pointer;
  color: #52525b;
}
.rf-datasheet-dialog .ds-upload-trigger:hover {
  background: #fafafa;
}
.rf-datasheet-dialog .ds-upload-trigger:disabled {
  cursor: default;
}
.rf-datasheet-dialog .ds-upload-name {
  font-size: 13px;
  font-weight: 500;
  color: #27272a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.rf-datasheet-dialog .ds-upload-size {
  font-size: 12px;
  white-space: nowrap;
  color: #71717a;
  flex: none;
}
.rf-datasheet-dialog .ds-options {
  height: 38px;
  display: flex;
  align-items: flex-end;
  gap: 23px;
}
.rf-datasheet-dialog .ds-options label {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-height: 28px;
  white-space: nowrap;
  cursor: pointer;
  font-size: 13px;
  color: #52525b;
}
.rf-datasheet-dialog .ds-options input {
  appearance: none;
  -webkit-appearance: none;
  width: 26px;
  height: 16px;
  background: #d4d4d8;
  border: 0;
  border-radius: 20px;
  position: relative;
  margin: 0;
  cursor: pointer;
  flex: none;
  transition: background .12s;
}
.rf-datasheet-dialog .ds-options input:after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px #0002;
  transition: transform .12s;
}
.rf-datasheet-dialog .ds-options input:checked {
  background: #27272a;
}
.rf-datasheet-dialog .ds-options input:checked:after {
  transform: translateX(10px);
}
.rf-datasheet-dialog .ds-options input:disabled {
  opacity: 0.45;
  cursor: default;
}
.rf-datasheet-dialog .ds-tabs {
  height: 43px;
  padding: 0 23px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e4e4e7;
}
.rf-datasheet-dialog .ds-tabs [role="tablist"] {
  height: 100%;
  display: flex;
  gap: 20px;
}
.rf-datasheet-dialog .ds-tabs [role="tab"] {
  height: 100%;
  padding: 0;
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  font-size: 12px;
  color: #71717a;
  cursor: pointer;
}
.rf-datasheet-dialog .ds-tabs [role="tab"][aria-selected="true"] {
  border-bottom-color: #27272a;
  color: #18181b;
  font-weight: 600;
}
.rf-datasheet-dialog .ds-tabs select {
  width: 140px;
  font-size: 12px;
  color: #71717a;
  background: #fff;
  border: 0;
  border-radius: 4px;
  padding: 4px 0;
  outline-offset: 0;
}
.rf-datasheet-dialog .ds-content {
  min-height: 0;
  flex: 1;
  overflow: hidden;
  background: #fff;
}
.rf-datasheet-dialog .ds-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #71717a;
}
.rf-datasheet-dialog .ds-empty-icon {
  height: 24px;
  color: #a1a1aa;
}
.rf-datasheet-dialog .ds-components {
  height: 100%;
  padding: 0 23px;
  overflow-y: auto;
}
.rf-datasheet-dialog .ds-result-heading {
  height: 62px;
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}
.rf-datasheet-dialog .ds-result-heading strong {
  font-size: 13px;
  font-weight: 600;
  max-width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rf-datasheet-dialog .ds-result-heading > span {
  font-size: 12px;
  color: #71717a;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rf-datasheet-dialog .ds-component-list {
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  overflow: hidden;
}
.rf-datasheet-dialog .ds-component-row {
  height: 65px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 15px;
  border-bottom: 1px solid #ededf0;
}
.rf-datasheet-dialog .ds-component-row:last-child {
  border-bottom: 0;
}
.rf-datasheet-dialog .ds-component-icon {
  color: #71717a;
  flex: none;
}
.rf-datasheet-dialog .ds-component-label {
  font-size: 13px;
  font-weight: 500;
  flex: 1;
  min-width: 0;
}
.rf-datasheet-dialog
  .ds-component-row[data-available="false"]
  > .rf-datasheet-dialog
  .ds-component-icon,
.rf-datasheet-dialog
  .ds-component-row[data-available="false"]
  > .rf-datasheet-dialog
  .ds-component-label {
  color: #a1a1aa;
}
.rf-datasheet-dialog .ds-use-button {
  width: 143px !important;
  flex: none;
  box-shadow: none !important;
  gap: 6px !important;
  justify-content: center !important;
}
.rf-datasheet-dialog .ds-use-button[aria-pressed="true"] {
  opacity: 1 !important;
  color: #71717a !important;
  background: #fafafa !important;
  border-color: #e4e4e7 !important;
}
.rf-datasheet-dialog .ds-button-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  flex: none;
}
.rf-datasheet-dialog .ds-button-icon svg[aria-label] {
  color: #3f7460;
}
.rf-datasheet-dialog .ds-files {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.rf-datasheet-dialog .ds-folder-bar {
  height: 39px;
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 17px;
  border-bottom: 1px solid #ededf0;
  color: #71717a;
  font-size: 12px;
}
.rf-datasheet-dialog .ds-folder-bar > span {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rf-datasheet-dialog .ds-file-panes {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
}
.rf-datasheet-dialog .ds-file-panes nav {
  border-right: 1px solid #e4e4e7;
  overflow: auto;
  padding: 6px;
  background: #fafafa;
}
.rf-datasheet-dialog .ds-file-panes nav button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 31px;
  padding: 0 8px;
  border: 0;
  border-radius: 4px;
  font-size: 12px;
  color: #52525b;
  text-align: left;
  background: none;
  cursor: pointer;
}
.rf-datasheet-dialog .ds-file-panes nav button span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rf-datasheet-dialog .ds-file-panes nav button svg {
  flex: none;
  color: #a1a1aa;
}
.rf-datasheet-dialog .ds-file-panes nav button[aria-current="true"] {
  background: #eaeaec;
  color: #18181b;
}
.rf-datasheet-dialog .ds-file-panes pre {
  margin: 0;
  overflow: auto;
  padding: 15px 18px;
  font: 12px / 1.75 ui-monospace, SFMono-Regular, Consolas, monospace;
  background: #fff;
  color: #3f3f46;
  tab-size: 2;
}
.rf-datasheet-dialog .ds-footer {
  height: 60px;
  flex: none;
  padding: 0 19px 0 23px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-top: 1px solid #e4e4e7;
  background: #fafafa;
}
.rf-datasheet-dialog .ds-status {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 7px;
  color: #71717a;
  font-size: 12px;
  line-height: 16px;
  max-height: 34px;
  overflow: auto;
}
.rf-datasheet-dialog .ds-status > svg {
  flex: none;
}
.rf-datasheet-dialog .ds-status[data-error="true"] {
  color: #b42318;
}
.rf-datasheet-dialog .ds-status > span {
  min-width: 0;
}
.rf-datasheet-dialog .ds-footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.rf-datasheet-dialog .ds-generate-button {
  min-width: 102px;
  box-shadow: none !important;
}
.rf-datasheet-dialog .ds-invisible {
  visibility: hidden;
}
.rf-datasheet-dialog .ds-spin {
  animation: rf-datasheet-spin 1s linear infinite;
}
@keyframes rf-datasheet-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 600px) {
  .rf-datasheet-dialog {
    width: calc(100vw - 24px) !important;
    height: min(650px, calc(100dvh - 24px));
    border-radius: 8px !important;
  }
  .rf-datasheet-dialog .ds-header {
    padding: 0 17px;
    height: 58px;
  }
  .rf-datasheet-dialog .ds-controls {
    padding: 16px 17px 12px;
  }
  .rf-datasheet-dialog .ds-options {
    gap: 15px;
    height: 38px;
  }
  .rf-datasheet-dialog .ds-options label {
    font-size: 12px;
    gap: 6px;
  }
  .rf-datasheet-dialog .ds-tabs {
    padding: 0 17px;
  }
  .rf-datasheet-dialog .ds-tabs select {
    width: 115px;
  }
  .rf-datasheet-dialog .ds-components {
    padding: 0 17px;
  }
  .rf-datasheet-dialog .ds-component-row {
    padding: 0 11px;
    gap: 9px;
  }
  .rf-datasheet-dialog .ds-component-label {
    font-size: 13px;
  }
  .rf-datasheet-dialog .ds-component-icon {
    width: 17px;
  }
  .rf-datasheet-dialog .ds-use-button {
    width: 130px !important;
  }
  .rf-datasheet-dialog .ds-result-heading {
    gap: 10px;
  }
  .rf-datasheet-dialog .ds-file-panes {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 110px minmax(0, 1fr);
  }
  .rf-datasheet-dialog .ds-file-panes nav {
    border-right: 0;
    border-bottom: 1px solid #e4e4e7;
  }
  .rf-datasheet-dialog .ds-file-panes pre {
    padding: 12px 16px;
    font-size: 12px;
  }
  .rf-datasheet-dialog .ds-footer {
    padding: 0 13px 0 17px;
    gap: 4px;
  }
  .rf-datasheet-dialog .ds-footer-actions {
    gap: 2px;
  }
  .rf-datasheet-dialog .ds-footer-actions button {
    padding-left: 10px;
    padding-right: 10px;
  }
  .rf-datasheet-dialog .ds-status {
    font-size: 12px;
  }
  .rf-datasheet-dialog .ds-generate-button {
    min-width: 88px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .rf-datasheet-dialog .ds-spin {
    animation: none;
  }
  .rf-datasheet-dialog .ds-options input,
  .rf-datasheet-dialog .ds-options input:after {
    transition: none;
  }
}
.rf-datasheet-dialog [hidden] {
  display: none !important;
}
.rf-datasheet-dialog .ds-unavailable {
  width: 143px;
  flex: none;
  text-align: center;
  font-size: 12px;
  color: #71717a;
}
.rf-datasheet-dialog .ds-file-panes pre:focus-visible {
  outline: 2px solid #71717a;
  outline-offset: -3px;
}
@media (max-width: 600px) {
  .rf-datasheet-dialog .ds-unavailable {
    width: 130px;
  }
}
@media (min-width: 620px) and (max-height: 520px) {
  .rf-datasheet-dialog .ds-header {
    height: 44px;
  }
  .rf-datasheet-dialog .ds-controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 20px;
    padding: 8px 17px;
  }
  .rf-datasheet-dialog .ds-upload {
    height: 44px;
  }
  .rf-datasheet-dialog .ds-options {
    height: auto;
    align-items: center;
    gap: 16px;
  }
  .rf-datasheet-dialog .ds-tabs {
    height: 36px;
  }
  .rf-datasheet-dialog .ds-result-heading {
    height: 32px;
  }
  .rf-datasheet-dialog .ds-component-row {
    height: 40px;
  }
  .rf-datasheet-dialog .ds-footer {
    height: 48px;
  }
}

.rf-datasheet-dialog .ds-footer {
  position: relative;
}
.rf-datasheet-dialog .ds-error-details {
  min-width: 0;
  width: 100%;
}
.rf-datasheet-dialog .ds-error-details summary {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
  cursor: pointer;
  list-style: none;
}
.rf-datasheet-dialog .ds-error-details summary::-webkit-details-marker {
  display: none;
}
.rf-datasheet-dialog .ds-error-details summary span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rf-datasheet-dialog .ds-error-details summary svg {
  flex: none;
}
.rf-datasheet-dialog .ds-error-details summary:focus-visible {
  outline: 2px solid #71717a;
  outline-offset: 2px;
}
.rf-datasheet-dialog .ds-error-details[open] summary svg {
  transform: rotate(180deg);
}
.rf-datasheet-dialog .ds-error-message {
  position: absolute;
  z-index: 1;
  bottom: calc(100% + 8px);
  left: 17px;
  right: 17px;
  max-height: min(240px, 50dvh);
  overflow: auto;
  margin: 0;
  padding: 14px;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  background: #fff;
  color: #3f3f46;
  box-shadow: 0 8px 24px #0001;
  font: 12px / 1.6 ui-monospace, SFMono-Regular, monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
`
