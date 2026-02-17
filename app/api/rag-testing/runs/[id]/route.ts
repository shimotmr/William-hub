import { NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

// GET /api/rag-testing/runs/[id] - Get run with results
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  // Get run details
  const { data: run, error: runError } = await supabase
    .from('rag_test_runs')
    .select('*')
    .eq('id', id)
    .single()
  
  if (runError) {
    return NextResponse.json({ error: runError.message }, { status: 404 })
  }
  
  // Get associated results
  const { data: results, error: resultsError } = await supabase
    .from('rag_test_results')
    .select('*')
    .eq('run_id', id)
    .order('id', { ascending: true })
  
  if (resultsError) {
    return NextResponse.json({ error: resultsError.message }, { status: 500 })
  }
  
  return NextResponse.json({ ...run, results })
}

// PUT /api/rag-testing/runs/[id] - Update run (e.g., add scores)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  
  const updateData: Record<string, unknown> = {}
  if (body.engine_version !== undefined) updateData.engine_version = body.engine_version
  if (body.model_config !== undefined) updateData.model_config = body.model_config
  if (body.total_score !== undefined) updateData.total_score = body.total_score
  if (body.accuracy_score !== undefined) updateData.accuracy_score = body.accuracy_score
  if (body.completeness_score !== undefined) updateData.completeness_score = body.completeness_score
  if (body.response_time_score !== undefined) updateData.response_time_score = body.response_time_score
  if (body.hallucination_score !== undefined) updateData.hallucination_score = body.hallucination_score
  
  const { data, error } = await supabase
    .from('rag_test_runs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// DELETE /api/rag-testing/runs/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  // Delete associated results first
  await supabase
    .from('rag_test_results')
    .delete()
    .eq('run_id', id)
  
  const { error } = await supabase
    .from('rag_test_runs')
    .delete()
    .eq('id', id)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
