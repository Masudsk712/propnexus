declare module "razorpay" {
  export interface RazorpayOptions {
    key_id: string;
    key_secret: string;
  }

  export interface RazorpayOrder {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
    notes?: Record<string, string>;
  }

  export interface RazorpayInstance {
    orders: {
      create(options: {
        amount: number;
        currency: string;
        receipt: string;
        notes?: Record<string, string>;
      }): Promise<RazorpayOrder>;
    };
  }

  export default class Razorpay {
    constructor(options: RazorpayOptions);
    orders: RazorpayInstance;
  }
}

declare module "crypto" {
  export function createHmac(algorithm: string, key: string): Hmac;
}

interface Hmac {
  update(data: string | Buffer): Hmac;
  digest(encoding: "hex" | "base64"): string;
}