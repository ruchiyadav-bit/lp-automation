import JSZip from "jszip";
import { saveAs } from "file-saver";

export async function downloadAsZip(htmlContent, filename = "page") {
  const zip = new JSZip();
  zip.file("index.html", htmlContent);
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  saveAs(blob, `${filename}.zip`);
}
