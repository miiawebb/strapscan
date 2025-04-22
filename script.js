function generatePdfReport({ resultText, detected, image, material, productType, region, inspectionType, status, signatureData }) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const banner = new Image();
  banner.crossOrigin = "anonymous";
  banner.src = "https://i.imgur.com/xCVtL06.jpeg"; // Replace if needed

  const drawPdf = () => {
    // 🔷 Banner — scale proportionally with min height
    const bannerWidth = 210;
    const bannerAspect = banner.height / banner.width;
    const bannerHeight = Math.max(60, bannerWidth * bannerAspect);
    doc.addImage(banner, "JPEG", 0, 0, bannerWidth, bannerHeight);

    let y = bannerHeight + 10;

    // 🔷 Title
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text("StrapScan Inspection Report", 14, y);
    y += 10;

    // 🔷 Timestamp
    const timestamp = new Date();
    const dateStr = timestamp.toLocaleDateString();
    const timeStr = timestamp.toLocaleTimeString();
    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.text(`Inspection Timestamp: ${dateStr} – ${timeStr}`, 14, y);
    y += 10;

    // 🔷 Outcome
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.setTextColor(status === "FAIL" ? "#b02a37" : "#256029");
    doc.text(`INSPECTION OUTCOME: ${status}`, 14, y);
    doc.setTextColor("#000");
    y += 12;

    // 🔷 Item Details
    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Item Details", 14, y);
    y += 8;
    doc.setFont(undefined, "normal");
    doc.text(`• Webbing Type: ${material}`, 14, y); y += 6;
    doc.text(`• Product Classification: ${productType}`, 14, y); y += 6;
    doc.text(`• Inspection Region: ${region === "us" ? "United States" : "Canada"}`, 14, y); y += 8;

    // 🔷 Inspection Focus
    doc.setFont(undefined, "bold");
    doc.text("Inspection Focus", 14, y);
    y += 8;
    doc.setFont(undefined, "normal");
    doc.text(`• ${inspectionType === "tag" ? "Label Verification" : "Damage Area"}`, 14, y);
    y += 10;

    // 🔷 Summary
    doc.setFont(undefined, "bold");
    doc.text("Inspection Summary", 14, y);
    y += 8;
    doc.setFont(undefined, "normal");
    const summaryLines = doc.splitTextToSize(`Result: Inspection ${status === "FAIL" ? "Failed" : "Passed"}\n${resultText}`, 180);
    doc.text(summaryLines, 14, y);
    y += summaryLines.length * 6;

    // 🔷 Detected Damage
    if (detected.length > 0) {
      doc.setFont(undefined, "bold");
      doc.text("Detected Damage Types", 14, y += 10);
      doc.setFont(undefined, "normal");
      detected.forEach(d => {
        doc.text(`• ${d}`, 18, y += 6);
      });
    }

    // 🔷 Final Recommendation
    doc.setFont(undefined, "bold");
    doc.text("Final Recommendation", 14, y += 12);
    doc.setFont(undefined, "normal");
    const recommendation = status === "FAIL"
      ? "Action Required: This strap is not safe for continued use. It must be taken out of service and replaced. Use of damaged webbing can result in catastrophic failure under load, posing serious risk to personnel and equipment."
      : "No action required: This strap passed the visual inspection and shows no signs of critical damage. Continue regular monitoring as part of your safety protocol.";
    const recLines = doc.splitTextToSize(recommendation, 180);
    doc.text(recLines, 14, y += 8);
    y += recLines.length * 6;

    // 🔷 Uploaded Image
    doc.setFont(undefined, "bold");
    doc.text("Uploaded Photo", 14, y += 12);
    const isPortrait = image.height > image.width;
    const imgWidth = isPortrait ? 90 : 130;
    const imgHeight = isPortrait ? 120 : 80;
    doc.addImage(image, "JPEG", 14, y += 4, imgWidth, imgHeight);
    y += imgHeight + 8;

    // 🔷 Signature (if present)
    if (signatureData) {
      doc.setFont(undefined, "bold");
      doc.text("Inspector Signature", 14, y += 10);
      doc.addImage(signatureData, "PNG", 14, y += 4, 80, 20);
      y += 30;
    }

    // 🔷 Footer Disclaimer (bottom-anchored)
    const pageHeight = doc.internal.pageSize.height;
    const footerY = pageHeight - 28;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont(undefined, "normal");
    const disclaimer = `This inspection report was automatically generated using AI-assisted image analysis provided by StrapScan. It supports visual evaluation of synthetic webbing products. This is not a certified inspection and should be reviewed by a qualified professional. © 2025 StrapScan. All rights reserved.`;
    const footerLines = doc.splitTextToSize(disclaimer, 180);
    doc.text(footerLines, 14, footerY);

    // 🔷 Save
    doc.save(`StrapScan_Report_${status}_${Date.now()}.pdf`);
  };

  if (banner.complete) {
    drawPdf();
  } else {
    banner.onload = drawPdf;
  }
}
