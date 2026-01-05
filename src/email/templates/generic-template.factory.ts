export default function createGenericTemplate(
  values: Record<string, any> = {},
  senderEmail: string,
  receiverEmail: string,
): string {
  const valueRows = Object.entries(values)
    .map(
      ([key, value]) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; width: 30%;">
            ${formatKey(key)}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
            ${formatValue(value)}
          </td>
        </tr>
      `,
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email from Dino App</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;">

              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                    Dino App
                  </h1>
                  <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px;">
                    Notification Service
                  </p>
                </td>
              </tr>

              <!-- Email Info -->
              <tr>
                <td style="padding: 24px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 8px 0;">
                        <span style="font-weight: 600; color: #374151; font-size: 14px;">From:</span>
                        <span style="color: #6b7280; font-size: 14px; margin-left: 8px;">${senderEmail}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">
                        <span style="font-weight: 600; color: #374151; font-size: 14px;">To:</span>
                        <span style="color: #6b7280; font-size: 14px; margin-left: 8px;">${receiverEmail}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content -->
              ${
                Object.keys(values).length > 0
                  ? `
              <tr>
                <td style="padding: 24px;">
                  <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 600;">
                    Email Details
                  </h2>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                    ${valueRows}
                  </table>
                </td>
              </tr>
              `
                  : `
              <tr>
                <td style="padding: 40px 24px; text-align: center;">
                  <p style="margin: 0; color: #6b7280; font-size: 16px;">
                    No additional information provided.
                  </p>
                </td>
              </tr>
              `
              }

              <!-- Footer -->
              <tr>
                <td style="padding: 24px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    This is an automated message from Dino App. Please do not reply to this email.
                  </p>
                  <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} Dino App. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '<em style="color: #9ca3af;">Not provided</em>';
  }

  if (typeof value === 'boolean') {
    return value ? '✓ Yes' : '✗ No';
  }

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return JSON.stringify(value, null, 2);
  }

  if (typeof value === 'string' && value.startsWith('http')) {
    return `<a href="${value}" style="color: #667eea; text-decoration: none;">${value}</a>`;
  }

  return String(value);
}
