import { NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

// POST /api/rag-testing/results - Add a result to a run
export async function POST(request: Request) {
  const body = await request.json()
  const { run_id, question_id, answer, confidence, accuracy, completeness, response_time_ms, hallucination_score, search_layers_used } = body
  
  if (!run_id || !question_id) {
    return NextResponse.json({ error: 'run_id and question_id are required' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('rag_test_results')
    .insert({
      run_id,
      question_id,
      answer,
      confidence: confidence || null,
      accuracy: accuracy || null,
      completeness: completeness || null,
      response_time_ms: response_time_ms || null,
      hallucination_score: hallucination_score || null,
      search_layers_used: search_layers_used || [],
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}
