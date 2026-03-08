import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

function nowIso() {
  return new Date().toISOString()
}

async function ensureCompany(name: string): Promise<number> {
  const cleanName = (name || '未分類').trim()
  
  const { data: existing } = await supabase
    .from('wecom_companies')
    .select('id')
    .eq('name', cleanName)
    .single()

  if (existing) {
    return existing.id
  }

  const { data, error } = await supabase
    .from('wecom_companies')
    .insert({ name: cleanName, created_at: nowIso(), updated_at: nowIso() })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

async function upsertConversation(externalUserid: string, openKfid: string, displayName: string = '') {
  if (!externalUserid) return

  const { error } = await supabase
    .from('wecom_conversations')
    .upsert({
      external_userid: externalUserid,
      open_kfid: openKfid || '',
      display_name: displayName || '',
      created_at: nowIso(),
      updated_at: nowIso()
    }, { onConflict: 'external_userid' })

  if (error) console.error('Upsert conv error:', error)
}

async function insertMessage(msgId: string, externalUserid: string, openKfid: string, 
  msgType: string, senderName: string, content: string, sendTime: number,
  sourceEvent: string, parentMsgId: string, raw: object) {
  
  const { error } = await supabase
    .from('wecom_messages')
    .upsert({
      msg_id: msgId || '',
      external_userid: externalUserid || '',
      open_kfid: openKfid || '',
      msg_type: msgType || '',
      sender_name: senderName || '',
      content: content || '',
      send_time: sendTime || 0,
      source_event: sourceEvent,
      parent_msg_id: parentMsgId || '',
      raw_json: JSON.stringify(raw),
      created_at: nowIso()
    }, { onConflict: 'msg_id,source_event,sender_name,send_time' })

  if (error) console.error('Insert msg error:', error)
}

function extractTextFromContent(rawContent: string): string {
  if (!rawContent) return ''
  try {
    const obj = JSON.parse(rawContent)
    if (obj.msgtype === 'text') {
      return ((obj.text || {}).content || '').trim()
    }
  } catch {}
  return rawContent
}

export async function POST() {
  try {
    const logPath = join(process.cwd(), '..', 'clawd', 'logs', 'wecom_inbox.log')
    let imported = 0
    let mergedSplit = 0

    try {
      const content = await readFile(logPath, 'utf-8')
      const lines = content.split('\n').filter(l => l.trim())

      for (const line of lines) {
        try {
          const rec = JSON.parse(line)
          
          if (rec.event === 'kf_sync_message') {
            const raw = rec.raw || {}
            const msgtype = raw.msgtype || ''
            const ext = raw.external_userid || ''
            const kfid = raw.open_kfid || ''
            const msgid = raw.msgid || ''
            const sendTime = raw.send_time || 0

            await upsertConversation(ext, kfid)

            if (msgtype === 'text') {
              const content = ((raw.text || {}).content || '').trim()
              await insertMessage(msgid, ext, kfid, 'text', '', content, sendTime, 'kf_sync_message', '', raw)
              imported++
            } else if (msgtype === 'merged_msg') {
              const merged = raw.merged_msg || {}
              const items = merged.item || []
              for (let idx = 0; idx < items.length; idx++) {
                const child = items[idx]
                const childContent = extractTextFromContent(child.msg_content || '')
                const childTime = child.send_time || sendTime
                const childSender = child.sender_name || ''
                const childType = child.msgtype || 'text'
                
                await insertMessage(
                  `${msgid}#${idx}`, ext, kfid, 
                  `merged/${childType}`, childSender, childContent, childTime,
                  'kf_sync_message_merged_item', msgid, child
                )
                imported++
                mergedSplit++
              }
            }
          } else if (rec.event === 'incoming_message' && rec.msg_type === 'text' && rec.accepted) {
            const ext = rec.from_user || ''
            const kfid = rec.to_user || ''
            const content = rec.content || ''
            
            await upsertConversation(ext, kfid)
            await insertMessage(
              rec.msg_id || '', ext, kfid, 'incoming/text', ext, content,
              Math.floor(Date.now() / 1000), 'incoming_message', '', rec
            )
            imported++
          }
        } catch {}
      }
    } catch (err) {
      console.log('Log file not found or read error:', err)
    }

    return NextResponse.json({ imported, merged_split: mergedSplit })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
