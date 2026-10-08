export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 res.status(200).json({methods:{card:false,wallet:false,apple_pay:false,google_pay:false},reason:'PAYMENTS_NOT_READY'});
}
