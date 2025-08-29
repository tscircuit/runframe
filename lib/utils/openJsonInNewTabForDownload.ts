/**
 * Opens JSON content in a new tab, triggers download, and closes the tab
 */
export const openJsonInNewTabForDownload = (
  content: string,
  fileName: string,
): void => {
  const newWindow = window.open("", "_blank")

  if (!newWindow) {
    console.warn("Popup blocked, cannot open JSON in new tab")
    return
  }

  // Create a minimal HTML page that just triggers download and closes
  const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Downloading: ${fileName}</title>
      </head>
      <body>
        <p>Downloading ${fileName}...</p>
        
        <script>
          function downloadAndClose() {
            const blob = new Blob([${JSON.stringify(content)}], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = ${JSON.stringify(fileName)};
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Close the tab after a short delay to ensure download started
            setTimeout(() => {
              window.close();
            }, 100);
          }
          
          // Auto-download and close when the page loads
          window.addEventListener('load', () => {
            downloadAndClose();
          });
        </script>
      </body>
      </html>
    `

  newWindow.document.write(html)
  newWindow.document.close()
}
