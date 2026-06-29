/**
 * Modular OTP Service
 * Set DEV_MODE = true to simulate OTPs during development.
 * When DEV_MODE is false, this integrates with real providers (Twilio, SendGrid, Firebase).
 */
const DEV_MODE = true; // Flag to toggle real vs simulated OTPs

const otpStore = new Map(); // Basic in-memory store for OTPs (identifier -> {otp, expiry})

const otpService = {
  async sendPhoneOTP(phone) {
    if (DEV_MODE) {
      console.log(`[OTP Simulator] Simulated SMS to ${phone}: Your FindMyRoom OTP is 1234.`);
      otpStore.set(phone, { otp: "1234", expiry: Date.now() + 5 * 60000 });
      return { success: true, message: "OTP sent successfully." };
    } else {
      // Integration point for Twilio or Firebase SMS
      throw new Error("Real SMS provider not configured.");
    }
  },

  async verifyPhoneOTP(phone, otp) {
    if (DEV_MODE) {
      const record = otpStore.get(phone);
      if (!record) return { success: false, message: "No OTP requested." };
      if (Date.now() > record.expiry) return { success: false, message: "OTP expired." };
      if (record.otp !== otp) return { success: false, message: "Invalid OTP." };
      
      otpStore.delete(phone);
      return { success: true };
    } else {
      // Integration point for real OTP verification
      throw new Error("Real SMS provider not configured.");
    }
  },

  async sendEmailOTP(email) {
    if (DEV_MODE) {
      console.log(`[OTP Simulator] Simulated Email to ${email}: Your FindMyRoom OTP is 1234.`);
      otpStore.set(email, { otp: "1234", expiry: Date.now() + 5 * 60000 });
      return { success: true, message: "OTP sent successfully." };
    } else {
      // Integration point for SendGrid or AWS SES
      throw new Error("Real Email provider not configured.");
    }
  },

  async verifyEmailOTP(email, otp) {
    if (DEV_MODE) {
      const record = otpStore.get(email);
      if (!record) return { success: false, message: "No OTP requested." };
      if (Date.now() > record.expiry) return { success: false, message: "OTP expired." };
      if (record.otp !== otp) return { success: false, message: "Invalid OTP." };
      
      otpStore.delete(email);
      return { success: true };
    } else {
      throw new Error("Real Email provider not configured.");
    }
  }
};

module.exports = otpService;
