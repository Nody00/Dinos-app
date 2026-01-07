export default function createWelcomeUserTemplate(
  firstName: string,
  lastName: string,
  email: string,
) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Our Platform</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f7fa;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 40px 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                          Welcome Aboard! 🎉
                        </h1>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 40px;">
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td>
                        <h2 style="margin: 0 0 20px; color: #333333; font-size: 24px; font-weight: 600;">
                          Hi ${firstName} ${lastName},
                        </h2>
                        <p style="margin: 0 0 20px; color: #555555; font-size: 16px; line-height: 1.6;">
                          We're thrilled to have you join our community! Your account has been successfully created and you're all set to get started.
                        </p>
                        <p style="margin: 0 0 30px; color: #555555; font-size: 16px; line-height: 1.6;">
                          Your registered email is: <strong style="color: #667eea;">${email}</strong>
                        </p>

                        <!-- CTA Button -->
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td align="center" style="padding: 20px 0;">
                              <a href="#" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                                Get Started
                              </a>
                            </td>
                          </tr>
                        </table>

                        <!-- Features Section -->
                        <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 30px;">
                          <tr>
                            <td style="padding: 20px; background-color: #f8f9fc; border-radius: 6px; border-left: 4px solid #667eea;">
                              <h3 style="margin: 0 0 15px; color: #333333; font-size: 18px; font-weight: 600;">
                                What's Next?
                              </h3>
                              <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 15px; line-height: 1.8;">
                                <li style="margin-bottom: 10px;">Complete your profile to personalize your experience</li>
                                <li style="margin-bottom: 10px;">Explore our features and discover what we offer</li>
                                <li style="margin-bottom: 10px;">Connect with our community and start engaging</li>
                              </ul>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 30px 0 0; color: #555555; font-size: 16px; line-height: 1.6;">
                          If you have any questions, feel free to reach out to our support team. We're here to help!
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #f8f9fc; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="text-align: center;">
                        <p style="margin: 0 0 10px; color: #888888; font-size: 14px;">
                          Thanks for choosing us!
                        </p>
                        <p style="margin: 0; color: #aaaaaa; font-size: 12px; line-height: 1.6;">
                          © ${new Date().getFullYear()} Your Company Name. All rights reserved.<br>
                          This email was sent to ${email}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `.trim();
}
