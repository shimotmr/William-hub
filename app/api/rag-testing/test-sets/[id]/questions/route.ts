import { NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

// GET /api/rag-testing/test-sets/[id]/questions
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  const { data, error } = await supabase
    .from('rag_test_questions')
    .select('*')
    .eq('test_set_id', id)
    .order('created_at', { ascending: true })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// POST /api/rag-testing/test-sets/[id]/questions - Create questions (batch)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  
  // Support both single question and batch questions
  const questions = Array.isArray(body) ? body : [body]
  const testSetId = parseInt(id)
  
  const questionsToInsert = questions.map((q: { question: string; expected_answer?: string; category?: string; difficulty?: string }) => ({
    test_set_id: testSetId,
    question: q.question,
    expected_answer: q.expected_answer || null,
    category: q.category || null,
    difficulty: q.difficulty || null,
  }))
  
  const { data, error } = await supabase
    .from('rag_test_questions')
    .insert(questionsToInsert)
    .select()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Update question_count in test_set
  try {
    await supabase.rpc('increment_question_count', { test_set_id: testSetId })
  } catch {
    // If RPC fails, try manual update
    const { count } = await supabase
      .from('rag_test_questions')
      .select('id', { count: 'exact', head: true })
      .eq('test_set_id', testSetId)
    
    await supabase
      .from('rag_test_sets')
      .update({ question_count: count || 0 })
      .eq('id', testSetId)
  }
  
  return NextResponse.json(data, { status: 201 })
}
