import { NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

// PATCH /api/rag-testing/test-sets/[id]/questions/[questionId]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  const { questionId } = await params
  const body = await request.json()
  const { question, expected_answer, category, difficulty } = body
  
  const updateData: Record<string, unknown> = {}
  if (question !== undefined) updateData.question = question
  if (expected_answer !== undefined) updateData.expected_answer = expected_answer
  if (category !== undefined) updateData.category = category
  if (difficulty !== undefined) updateData.difficulty = difficulty
  
  const { data, error } = await supabase
    .from('rag_test_questions')
    .update(updateData)
    .eq('id', questionId)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// DELETE /api/rag-testing/test-sets/[id]/questions/[questionId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  const { questionId } = await params
  
  const { error } = await supabase
    .from('rag_test_questions')
    .delete()
    .eq('id', questionId)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
