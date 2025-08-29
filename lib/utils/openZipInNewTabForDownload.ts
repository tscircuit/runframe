export const openZipInNewTabForDownload = async (
  zipBlob: Blob,
  fileName: string,
): Promise<void> => {
  const newWindow = window.open("", "_blank")

  if (!newWindow) {
    console.warn("Popup blocked, cannot open ZIP in new tab")
    return
  }

  // Convert blob to base64 for embedding (like we do with JSON content)
  const arrayBuffer = await zipBlob.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)
  const base64String = btoa(String.fromCharCode(...uint8Array))

  // Create a minimal HTML page that triggers download and closes
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
            // Convert base64 back to binary data
            const base64 = ${JSON.stringify(base64String)};
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            const blob = new Blob([bytes], { type: 'application/zip' });
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
