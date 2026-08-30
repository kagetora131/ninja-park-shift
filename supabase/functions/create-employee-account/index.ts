import { createClient } from 'jsr:@supabase/supabase-js@2';

// マネージャーが「スタッフ管理」から新しい従業員を雇った際に、
// その従業員用のログインアカウント(auth.users + profiles)を作成するEdge Function。
// サービスロールキーはこの関数のサーバー側だけで保持し、クライアントには一切渡さない。

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: '認証が必要です' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 呼び出し元のJWTで本人確認+ロール確認(マネージャーのみ許可)
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData.user) return json({ error: '認証に失敗しました' }, 401);

    const { data: profile } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (profile?.role !== 'manager') {
      return json({ error: 'マネージャー権限が必要です' }, 403);
    }

    const { employeeId, email, password } = await req.json();
    if (!employeeId || !email || !password) {
      return json({ error: 'employeeId, email, password は必須です' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: employee } = await adminClient
      .from('employees')
      .select('id')
      .eq('id', employeeId)
      .maybeSingle();
    if (!employee) return json({ error: `従業員 ${employeeId} が見つかりません` }, 404);

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError || !created.user) {
      return json({ error: createError?.message ?? 'アカウント作成に失敗しました' }, 400);
    }

    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({ id: created.user.id, employee_id: employeeId, role: 'employee' });
    if (profileError) {
      // profiles作成に失敗した場合は作成済みのauth userをロールバックする
      await adminClient.auth.admin.deleteUser(created.user.id);
      return json({ error: profileError.message }, 400);
    }

    return json({ userId: created.user.id, email });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
