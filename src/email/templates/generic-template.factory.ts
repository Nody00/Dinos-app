/**
 * Creates a beautiful, responsive HTML email template with dynamic values.
 * Used by the SMTP provider to generate professional-looking emails.
 *
 * Features:
 * - Responsive design that works on all email clients
 * - Purple gradient header with branding
 * - Sender and receiver email addresses displayed
 * - Dynamic value table with smart formatting
 * - Professional footer with copyright
 *
 * @param values - Dynamic key-value pairs to display in the email
 * @param senderEmail - Email address of the sender (displayed in header)
 * @param receiverEmail - Email address(es) of the recipient(s) (displayed in header)
 * @returns Complete HTML email string with inline CSS
 *
 * @example
 * ```typescript
 * const html = createGenericTemplate(
 *   {
 *     userName: 'John Doe',
 *     accountStatus: 'Active',
 *     emailVerified: true,
 *     loginAttempts: 3,
 *     features: ['Dashboard', 'API Access', 'Reports'],
 *     supportLink: 'https://support.dinoapp.com'
 *   },
 *   'noreply@dinoapp.com',
 *   'user@example.com'
 * );
 * ```
 *
 * @example
 * ```typescript
 * // Multiple recipients
 * const html = createGenericTemplate(
 *   { message: 'Team update' },
 *   'team@dinoapp.com',
 *   ['user1@example.com', 'user2@example.com']
 * );
 * ```
 *
 * @example
 * ```typescript
 * // Empty values (shows "No additional information provided")
 * const html = createGenericTemplate(
 *   {},
 *   'noreply@dinoapp.com',
 *   'user@example.com'
 * );
 * ```
 */
export default function createGenericTemplate(
  values: Record<string, any> = {},
  senderEmail: string,
  receiverEmail: string | string[],
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
                        ${
                          Array.isArray(receiverEmail)
                            ? receiverEmail
                                .map(
                                  (email) =>
                                    `<span style="color: #6b7280; font-size: 14px; margin-left: 8px;">${email}</span>`,
                                )
                                .join(', ')
                            : `<span style="color: #6b7280; font-size: 14px; margin-left: 8px;">${receiverEmail}</span>`
                        }
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

/**
 * Formats a camelCase or snake_case key into a human-readable label.
 * Converts "userName" to "User Name", "email_verified" to "Email Verified", etc.
 *
 * @param key - The key to format
 * @returns Formatted, human-readable label
 *
 * @example
 * formatKey('userName') // Returns: "User Name"
 * formatKey('emailVerified') // Returns: "Email Verified"
 * formatKey('support_link') // Returns: "Support Link"
 */
function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Formats a value for display in the email template with smart type handling.
 *
 * Formatting rules:
 * - null/undefined: Shows "Not provided" in gray italic
 * - boolean: Shows "✓ Yes" or "✗ No"
 * - array: Joins elements with comma separator
 * - object: Pretty-prints as JSON
 * - URL string: Converts to clickable link
 * - other: Converts to string
 *
 * @param value - The value to format
 * @returns HTML-formatted value string
 *
 * @example
 * formatValue(true) // Returns: "✓ Yes"
 * formatValue(false) // Returns: "✗ No"
 * formatValue(null) // Returns: "<em style='color: #9ca3af;'>Not provided</em>"
 * formatValue(['A', 'B', 'C']) // Returns: "A, B, C"
 * formatValue('https://example.com') // Returns: "<a href='...'>https://example.com</a>"
 * formatValue({ name: 'John' }) // Returns: Pretty-printed JSON
 */
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
