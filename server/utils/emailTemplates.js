export function generateOtpEmailTemplate(otpCode) {
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OTP Verification</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
          }
          .email-container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(19, 20, 19, 0.1);
              overflow: hidden;
          }
          .header {
              background-color:rgb(19, 20, 19);
              color: white;
              text-align: center;
              padding: 20px;
          }
          .content {
              padding: 20px;
              text-align: center;
          }
          .otp-code {
              font-size: 24px;
              font-weight: bold;
              color:rgb(19, 20, 19);
              margin: 20px 0;
          }
          .footer {
              background-color: #f4f4f4;
              text-align: center;
              padding: 10px;
              font-size: 12px;
              color: #888;
          }
      </style>
  </head>
  <body>
      <div class="email-container">
          <div class="header">
              <h1>OTP Verification</h1>
          </div>
          <div class="content">
              <p>Use the following OTP to complete your verification process:</p>
              <div class="otp-code">${otpCode}</div> <!-- Dynamic OTP -->
              <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
          </div>
          <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Bookworm team. All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>
  `;
  }

export function generateForgotPasswordEmailTemplate(resetPasswordUrl) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .email-container {
                max-width: 600px;
                margin: 20px auto;
                background: #ffffff;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(19, 20, 19, 0.1);
                overflow: hidden;
            }
            .header {
                background-color: rgb(19, 20, 19);
                color: white;
                text-align: center;
                padding: 20px;
            }
            .content {
                padding: 20px;
                text-align: center;
                color: black; /* Ensure text is black */
            }
            .content p {
                color: black;
            }
            .reset-button {
                display: inline-block;
                padding: 10px 20px;
                margin: 20px 0;
                font-size: 16px;
                color: white !important;
                background-color: rgb(19, 20, 19);
                text-decoration: none;
                border-radius: 5px;
            }
            .footer {
                background-color: #f4f4f4;
                text-align: center;
                padding: 10px;
                font-size: 12px;
                color: #888;
            }
            .backup-link {
                word-break: break-all;
            }
            .backup-link a {
                color: blue;
                text-decoration: underline;
            }

        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>Reset Your Password</h1>
            </div>
            <div class="content">
                <p>We received a request to reset your password.</p>
                <p>If you did not make this request, please ignore this email.</p>
                <a href="${resetPasswordUrl}" class="reset-button">Reset Password</a>
                <p>This link will expire in 15 minutes.</p>
                <hr style="margin: 20px 0;">
                <p>If the button above doesn't work, please copy and paste the following URL into your browser:</p>
                <p class="backup-link"><a href="${resetPasswordUrl}">${resetPasswordUrl}</a></p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} CrimeLogix team. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
  