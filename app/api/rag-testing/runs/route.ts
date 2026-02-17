import { NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

// GET /api/rag-testing/runs - List all test runs
export async function GET() {
  const { data, error } = await supabase
    .from('rag_test_runs')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// POST /api/rag-testing/runs - Create a new test run
export async function POST(request: Request) {
  const body = await request.json()
  const { test_set_id, engine_version, model_config } = body
  
  if (!test_set_id) {
    return NextResponse.json({ error: 'test_set_id is required' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('rag_test_runs')
    .insert({
      test_set_id,
      engine_version,
      model_config: model_config || {},
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}
