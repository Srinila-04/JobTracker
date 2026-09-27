import { createClient } from '@supabase/supabase-js';
const supabase = createClient('', '');

async function check() {
  const { data: apps, error } = await supabase.from('applications').select('*');
  console.log('Applications count:', apps?.length, error);
}
check();
