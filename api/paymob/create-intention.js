// OPS-04 must add authenticated order lookup and verified payment webhooks.
// Never initiate a charge from a browser-supplied amount.
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'METHOD_NOT_ALLOWED'})}
 return res.status(503).json({error:'PAYMENTS_NOT_READY'});
}
