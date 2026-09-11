import { createSupabaseServerClient } from '@/lib/supabase-server';
import LivyaDashboard from './LivyaDashboard';

export default async function Dashboard(){
  const supabase=await createSupabaseServerClient();
  const {data:{user}}=await supabase.auth.getUser();
  const {data:profile}=user?await supabase.from('profiles').select('full_name').eq('id',user.id).maybeSingle():{data:null};
  const name=profile?.full_name||user?.user_metadata?.full_name||user?.email?.split('@')[0]||'there';
  return <LivyaDashboard name={name}/>;
}
