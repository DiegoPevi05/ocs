import puppeteer from 'puppeteer';

export class PuppeteerService {
  // Method to generate PDF
  static async generatePdf(
    fullHtmlContent: string,  // HTML content (required)
    headerTemplate: string,   // Header template (required)
    footerTemplate: string,   // Footer template (required)
    marginTop: string = '60px', // Optional: default margin-top
    marginBottom: string = '60px' // Optional: default margin-bottom
  ): Promise<Buffer> {

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(fullHtmlContent);

    // PDF generation options
    const pdfBuffer = await page.pdf({
      format: 'A4',
      displayHeaderFooter: true,
      headerTemplate: headerTemplate,
      footerTemplate: footerTemplate,
      margin: {
        top: marginTop,
        bottom: marginBottom,
      },
    });

    await browser.close();

    return Buffer.from(pdfBuffer);
  }
}
