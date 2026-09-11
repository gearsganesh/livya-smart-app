import {createSupabaseServerClient} from '@/lib/supabase-server';
import AdminWorkspace from '../AdminWorkspace';
export default async function Dashboard(){const supabase=await createSupabaseServerClient();const{data:{user}}=await supabase.auth.getUser();const{data:staff}=user?await supabase.from('staff_users').select('display_name,role').eq('user_id',user.id).maybeSingle():{data:null};return <AdminWorkspace displayName={staff?.display_name||user?.email||'Care team'}/>}
