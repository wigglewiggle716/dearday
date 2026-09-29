export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const methods={
    card:Boolean(process.env.PAYMOB_CARD_INTEGRATION_ID),
    wallet:Boolean(process.env.PAYMOB_WALLET_INTEGRATION_ID),
    apple_pay:Boolean(process.env.PAYMOB_APPLE_PAY_INTEGRATION_ID),
    google_pay:Boolean(process.env.PAYMOB_GOOGLE_PAY_INTEGRATION_ID)
  };
  res.status(200).json({methods});
}
