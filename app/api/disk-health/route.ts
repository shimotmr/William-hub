import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/disk-health - 查詢磁碟健康度與清理記錄
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'overview'; // overview, cleanup_log, health_history

    if (type === 'cleanup_log') {
      // 清理記錄（最近 20 筆）
      const { data, error } = await supabase
        .from('cleanup_log')
        .select('*')
        .order('cleanup_date', { ascending: false })
        .limit(20);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        count: data.length,
        logs: data
      });
    }

    if (type === 'health_history') {
      // 健康度歷史（最近 30 天）
      const { data, error } = await supabase
        .from('disk_health_history')
        .select('*')
        .gte('check_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('check_date', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        count: data.length,
        history: data
      });
    }

    // overview: 總覽
    const [cleanupRes, healthRes, latestHealthRes] = await Promise.all([
      supabase
        .from('cleanup_log')
        .select('*')
        .order('cleanup_date', { ascending: false })
        .limit(5),
      supabase
        .from('disk_health_history')
        .select('*')
        .gte('check_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('check_date', { ascending: true }),
      supabase
        .from('disk_health_history')
        .select('*')
        .order('check_date', { ascending: false })
        .limit(1)
        .single()
    ]);

    if (cleanupRes.error || healthRes.error) {
      return NextResponse.json(
        { error: 'Failed to fetch overview data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      latest_health: latestHealthRes.data,
      recent_cleanups: cleanupRes.data,
      health_trend: healthRes.data
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/disk-health - 記錄新的清理或健康檢查
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body; // type: cleanup | health_check

    if (type === 'cleanup') {
      const { trigger_reason, before_usage_percent, after_usage_percent, items_deleted, notes, performed_by } = data;

      const { data: result, error } = await supabase
        .from('cleanup_log')
        .insert({
          trigger_reason: trigger_reason || 'manual',
          before_usage_percent,
          after_usage_percent,
          items_deleted,
          notes,
          performed_by: performed_by || 'system'
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, log: result });
    }

    if (type === 'health_check') {
      const { total_gb, used_gb, free_gb, usage_percent, openclaw_size_mb, clawd_size_mb, alert_level, notes } = data;

      const { data: result, error } = await supabase
        .from('disk_health_history')
        .insert({
          total_gb,
          used_gb,
          free_gb,
          usage_percent,
          openclaw_size_mb,
          clawd_size_mb,
          alert_level,
          notes
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, record: result });
    }

    return NextResponse.json(
      { error: 'Invalid type (must be cleanup or health_check)' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
