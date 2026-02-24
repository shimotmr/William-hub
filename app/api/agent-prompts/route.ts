import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/agent-prompts - 列出所有 agent 或查詢特定 agent
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const agentName = searchParams.get('name');

    if (agentName) {
      // 查詢特定 agent
      const { data, error } = await supabase
        .from('agent_prompts')
        .select('*')
        .eq('agent_name', agentName.toLowerCase())
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    // 列出所有 agent
    const { data, error } = await supabase
      .from('agent_prompts')
      .select('id, agent_name, display_name, version, emoji, description, updated_at, last_synced_at')
      .order('agent_name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      count: data.length,
      agents: data
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/agent-prompts - 新增或更新單個 agent 提示詞
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_name, display_name, content, version, emoji, description, file_path } = body;

    if (!agent_name || !content) {
      return NextResponse.json(
        { error: 'agent_name and content are required' },
        { status: 400 }
      );
    }

    // Upsert (insert or update)
    const { data, error } = await supabase
      .from('agent_prompts')
      .upsert({
        agent_name: agent_name.toLowerCase(),
        display_name: display_name || agent_name,
        content,
        version: version || '1.0.0',
        emoji: emoji || '🤖',
        description,
        file_path,
        last_synced_at: new Date().toISOString()
      }, {
        onConflict: 'agent_name'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      agent: data
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/agent-prompts - 批量同步（從檔案系統）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { agents } = body; // Array of agent objects

    if (!agents || !Array.isArray(agents)) {
      return NextResponse.json(
        { error: 'agents array is required' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const agent of agents) {
      const { agent_name, display_name, content, version, emoji, description, file_path } = agent;

      if (!agent_name || !content) {
        errors.push({ agent_name, error: 'Missing required fields' });
        continue;
      }

      const { data, error } = await supabase
        .from('agent_prompts')
        .upsert({
          agent_name: agent_name.toLowerCase(),
          display_name: display_name || agent_name,
          content,
          version: version || '1.0.0',
          emoji: emoji || '🤖',
          description,
          file_path,
          last_synced_at: new Date().toISOString()
        }, {
          onConflict: 'agent_name'
        })
        .select()
        .single();

      if (error) {
        errors.push({ agent_name, error: error.message });
      } else {
        results.push(data);
      }
    }

    return NextResponse.json({
      success: true,
      synced: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/agent-prompts - 刪除特定 agent
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const agentName = searchParams.get('name');

    if (!agentName) {
      return NextResponse.json(
        { error: 'agent name is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('agent_prompts')
      .delete()
      .eq('agent_name', agentName.toLowerCase());

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
