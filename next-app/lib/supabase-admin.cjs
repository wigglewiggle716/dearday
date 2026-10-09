'use strict';
const {createClient}=require('@supabase/supabase-js');
let client;
function getSupabaseAdmin(){
 if(client)return client;
 const url=process.env.SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('SUPABASE_SERVER_NOT_CONFIGURED');
 client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 return client;
}
module.exports={getSupabaseAdmin};
