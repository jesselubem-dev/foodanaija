import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const generateEmailHtml = (customerName) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Fooda Naija – Today's Menu 🍛</title>
</head>
<body style="margin:0;padding:0;background-color:#fff8f0;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 30px rgba(0,0,0,0.08);">

          <!-- HEADER BANNER -->
          <tr>
            <td style="background:linear-gradient(135deg,#ff6b35 0%,#f7931e 100%);padding:0;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:30px 30px 10px;text-align:center;">
                    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.85);text-transform:uppercase;letter-spacing:2px;font-weight:600;">Fresh • Fast • Naija Taste 🇳🇬</p>
                    <h1 style="margin:8px 0 0;font-size:42px;color:#ffffff;font-weight:900;letter-spacing:-1px;">FOODA NAIJA</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 30px 30px;text-align:center;">
                    <div style="background:rgba(255,255,255,0.15);border-radius:50px;display:inline-block;padding:8px 24px;margin-top:12px;">
                      <p style="margin:0;color:#fff;font-size:14px;font-weight:600;">🔥 TODAY'S SPECIAL MENU IS HERE!</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- GREETING -->
          <tr>
            <td style="padding:32px 40px 8px;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#1a1a1a;">Hey ${customerName}! 👋</p>
              <p style="margin:10px 0 0;font-size:16px;color:#555;line-height:1.7;">
                Hungry? We've got something <strong style="color:#ff6b35;">extra delicious</strong> cooking for you today 😋<br/>
                Check out what's on the menu — your taste buds will thank you!
              </p>
            </td>
          </tr>

          <!-- SECTION TITLE -->
          <tr>
            <td style="padding:24px 40px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:2px solid #ff6b35;"></td>
                  <td style="padding:0 12px;white-space:nowrap;">
                    <p style="margin:0;font-size:14px;font-weight:800;color:#ff6b35;text-transform:uppercase;letter-spacing:2px;">🍛 Today's Menu</p>
                  </td>
                  <td style="border-top:2px solid #ff6b35;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MENU ITEMS -->
          <tr>
            <td style="padding:0 24px 16px;">

              <!-- Item 1 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;background:linear-gradient(135deg,#fff8f0,#fff3e8);border-radius:16px;overflow:hidden;border:1px solid #ffe0c0;">
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="48" style="vertical-align:middle;">
                          <div style="width:48px;height:48px;background:linear-gradient(135deg,#ff6b35,#f7931e);border-radius:12px;text-align:center;line-height:48px;font-size:22px;">🥘</div>
                        </td>
                        <td style="padding-left:16px;vertical-align:middle;">
                          <p style="margin:0;font-size:16px;font-weight:800;color:#1a1a1a;">Jollof Rice + Chicken</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#777;">Smoky, party-style jollof with juicy grilled chicken</p>
                        </td>
                        <td style="text-align:right;vertical-align:middle;white-space:nowrap;">
                          <span style="background:#ff6b35;color:#fff;font-weight:800;font-size:15px;padding:6px 14px;border-radius:50px;">₦2,500</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Item 2 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;background:linear-gradient(135deg,#f0fff4,#e8ffe8);border-radius:16px;overflow:hidden;border:1px solid #c0e0c0;">
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="48" style="vertical-align:middle;">
                          <div style="width:48px;height:48px;background:linear-gradient(135deg,#22c55e,#16a34a);border-radius:12px;text-align:center;line-height:48px;font-size:22px;">🍗</div>
                        </td>
                        <td style="padding-left:16px;vertical-align:middle;">
                          <p style="margin:0;font-size:16px;font-weight:800;color:#1a1a1a;">Fried Rice + Turkey</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#777;">Rich fried rice with well-seasoned crispy turkey</p>
                        </td>
                        <td style="text-align:right;vertical-align:middle;white-space:nowrap;">
                          <span style="background:#22c55e;color:#fff;font-weight:800;font-size:15px;padding:6px 14px;border-radius:50px;">₦2,800</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Item 3 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;background:linear-gradient(135deg,#fdf4ff,#f3e8ff);border-radius:16px;overflow:hidden;border:1px solid #d0b0e0;">
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="48" style="vertical-align:middle;">
                          <div style="width:48px;height:48px;background:linear-gradient(135deg,#a855f7,#7c3aed);border-radius:12px;text-align:center;line-height:48px;font-size:22px;">🍲</div>
                        </td>
                        <td style="padding-left:16px;vertical-align:middle;">
                          <p style="margin:0;font-size:16px;font-weight:800;color:#1a1a1a;">Egusi Soup + Pounded Yam</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#777;">Thick tasty egusi with soft stretchy pounded yam</p>
                        </td>
                        <td style="text-align:right;vertical-align:middle;white-space:nowrap;">
                          <span style="background:#a855f7;color:#fff;font-weight:800;font-size:15px;padding:6px 14px;border-radius:50px;">₦3,000</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Item 4 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;background:linear-gradient(135deg,#fff0f3,#ffe8ed);border-radius:16px;overflow:hidden;border:1px solid #e0c0c8;">
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="48" style="vertical-align:middle;">
                          <div style="width:48px;height:48px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:12px;text-align:center;line-height:48px;font-size:22px;">🍜</div>
                        </td>
                        <td style="padding-left:16px;vertical-align:middle;">
                          <p style="margin:0;font-size:16px;font-weight:800;color:#1a1a1a;">Spaghetti Stir Fry</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#777;">Savory spaghetti mixed with veggies and special sauce</p>
                        </td>
                        <td style="text-align:right;vertical-align:middle;white-space:nowrap;">
                          <span style="background:#ef4444;color:#fff;font-weight:800;font-size:15px;padding:6px 14px;border-radius:50px;">₦2,200</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Drinks -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border-radius:16px;overflow:hidden;border:1px solid #b0d8f0;">
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="48" style="vertical-align:middle;">
                          <div style="width:48px;height:48px;background:linear-gradient(135deg,#0ea5e9,#0284c7);border-radius:12px;text-align:center;line-height:48px;font-size:22px;">🥤</div>
                        </td>
                        <td style="padding-left:16px;vertical-align:middle;">
                          <p style="margin:0;font-size:16px;font-weight:800;color:#1a1a1a;">Drinks Available</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#777;">Coke | Fanta | Zobo | Chapman</p>
                        </td>
                        <td style="text-align:right;vertical-align:middle;white-space:nowrap;">
                          <span style="background:#0ea5e9;color:#fff;font-weight:800;font-size:15px;padding:6px 14px;border-radius:50px;">From ₦500</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FREE DELIVERY BANNER -->
          <tr>
            <td style="padding:8px 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#ff6b35,#f7931e);border-radius:16px;">
                <tr>
                  <td style="padding:20px;text-align:center;">
                    <p style="margin:0;font-size:20px;font-weight:900;color:#fff;">🔥 SPECIAL OFFER TODAY!</p>
                    <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.9);">Get <strong>FREE DELIVERY</strong> on orders above <strong>₦5,000</strong></p>
                    <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">Limited time — don't miss out!</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- WHY ORDER -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:16px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:14px;font-weight:800;color:#1a1a1a;text-transform:uppercase;letter-spacing:1px;">🚀 Why Order from Fooda Naija?</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding:4px 8px 4px 0;font-size:13px;color:#444;">✅ Freshly prepared meals</td>
                        <td width="50%" style="padding:4px 0 4px 8px;font-size:13px;color:#444;">✅ Hygienic cooking process</td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding:4px 8px 4px 0;font-size:13px;color:#444;">✅ Fast delivery</td>
                        <td width="50%" style="padding:4px 0 4px 8px;font-size:13px;color:#444;">✅ Affordable prices</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA BUTTON -->
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <a href="https://foodanaija.com" style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#f7931e);color:#fff;text-decoration:none;font-size:18px;font-weight:900;padding:18px 48px;border-radius:50px;box-shadow:0 8px 24px rgba(255,107,53,0.4);letter-spacing:0.5px;">
                👉 ORDER NOW — foodanaija.com
              </a>
              <p style="margin:12px 0 0;font-size:13px;color:#999;">Tap above to place your order instantly 📲</p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a1a,#2d2d2d);padding:28px 40px;text-align:center;">
              <p style="margin:0;font-size:18px;font-weight:900;color:#ff6b35;">FOODA NAIJA 🇳🇬</p>
              <p style="margin:8px 0 0;font-size:13px;color:#999;">Fast Delivery | Fresh Meals | Naija Taste</p>
              <p style="margin:16px 0 0;font-size:12px;color:#666;">
                <a href="https://foodanaija.com" style="color:#ff6b35;text-decoration:none;">Visit Website</a>
                &nbsp;|&nbsp;
                <a href="https://foodanaija.com" style="color:#666;text-decoration:none;">Unsubscribe</a>
                &nbsp;|&nbsp;
                <a href="https://foodanaija.com" style="color:#666;text-decoration:none;">Contact Us</a>
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#555;">© 2026 Fooda Naija. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const testMode = body?.test_mode === true;
    const testEmail = body?.test_email || 'jesselubem@gmail.com';

    if (testMode) {
      // Send test email only
      await base44.integrations.Core.SendEmail({
        from_name: 'Fooda Naija',
        to: testEmail,
        subject: "🍛 Today's Menu is Here, Jesse! | Fooda Naija",
        body: generateEmailHtml('Jesse'),
      });
      return Response.json({ success: true, message: `Test email sent to ${testEmail}`, sent: 1 });
    }

    // Send to all users
    const users = await base44.asServiceRole.entities.User.list();
    let sent = 0;
    let failed = 0;

    for (const u of users) {
      if (!u.email) continue;
      const firstName = (u.full_name || 'Valued Customer').split(' ')[0];
      try {
        await base44.integrations.Core.SendEmail({
          from_name: 'Fooda Naija',
          to: u.email,
          subject: `🍛 Today's Menu is Here, ${firstName}! | Fooda Naija`,
          body: generateEmailHtml(firstName),
        });
        sent++;
      } catch (e) {
        failed++;
      }
    }

    return Response.json({ success: true, message: `Campaign sent!`, sent, failed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});