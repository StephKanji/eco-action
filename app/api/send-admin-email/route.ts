import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
})

export async function POST(req: NextRequest) {
  const { to, org_name, verified, reason } = await req.json()

  await transporter.sendMail({
    from: `"EcoTrack" <no-reply@ecotrack.com>`,
    to,
    subject: verified
      ? 'Your organisation has been verified'
      : 'Your organisation registration was not verified',
    html: verified
      ? `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;">
          <h2>Welcome, ${org_name}!</h2>
          <p>Your organisation has been <strong style="color:#16a34a;">verified</strong>.</p>
          <p>You can now log in and access your dashboard.</p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login"
            style="padding:12px 24px;background:#16a34a;color:white;text-decoration:none;border-radius:6px;display:inline-block;margin-top:16px;">
            Log In Now
          </a>
        </div>
      `
      : `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;">
          <h2>Registration Update</h2>
          <p>Unfortunately <strong>${org_name}</strong> was not verified at this time.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>If you believe this is an error, please contact support.</p>
        </div>
      `,
  })

  return NextResponse.json({ ok: true })
}