import { NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

// GET /api/rag-testing/test-sets - List all test sets
export async function GET() {
  const { data, error } = await supabase
    .from('rag_test_sets')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// POST /api/rag-testing/test-sets - Create a new test set
export async function POST(request: Request) {
  const body = await request.json()
  const { name, description } = body
  
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('rag_test_sets')
    .insert({ name, description })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}
