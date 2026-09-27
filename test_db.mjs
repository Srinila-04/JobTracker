import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://jcrdlxchxbirxseipkdp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjcmRseGNoeGJpcnhzZWlwa2RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNjYyMDksImV4cCI6MjEwNTY0MjIwOX0._ZGLzO6u-E2uewG6nuaqwCF-ivWVQEqYRDA87gJYpRE');

async function check() {
  const { data: jobs } = await supabase.from('jobs').select('id, title');
  console.log('Jobs:', jobs);
}
check();
