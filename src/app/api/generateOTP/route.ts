import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';
import crypto from 'crypto';
import { sendEmail } from './../../../hooks/emails';
// import nodemailer from 'nodemailer';


const redis = new Redis(process.env.REDIS_URL!);

// Generate and send OTP
export async function POST(req: NextRequest) {
  const { email } = await req.json();

  // Check if email is provided
  if (!email) {
    return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
  }

  try {
    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Store OTP in Redis for 5 minutes (300 seconds)
    await redis.setex(email, 300, otp);

    // Send OTP to user's email
    await sendEmail(email, 'Your OTP Code', `Your OTP is ${otp}. It will expire in 5 minutes.`);

    // Send success response
    return NextResponse.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Error generating OTP:', error);
    return NextResponse.json({ success: false, message: 'Error generating OTP' }, { status: 500 });
  }
}