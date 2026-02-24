import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { google } from 'googleapis';

// Google OAuth2 客戶端
function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return oauth2Client;
}

// GET - 檢查連接狀態或查詢報告同步狀態
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const reportId = searchParams.get('reportId');

    // 檢查 Drive 連接狀態
    if (action === 'status') {
      const auth = getOAuth2Client();
      const drive = google.drive({ version: 'v3', auth });
      
      const about = await drive.about.get({ fields: 'user' });
      
      return NextResponse.json({
        connected: true,
        user: about.data.user?.emailAddress,
        timestamp: new Date().toISOString(),
      });
    }

    // 查詢單一報告同步狀態
    if (reportId) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('reports')
        .select('id, title, google_drive_file_id, google_drive_link, drive_sync_status, drive_synced_at')
        .eq('id', reportId)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Missing action or reportId' }, { status: 400 });
  } catch (error: any) {
    console.error('Google Drive GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

// POST - 上傳單一報告到 Google Drive
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId } = body;

    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 });
    }

    // 從 Supabase 獲取報告
    const supabase = await createClient();
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (!report.md_content) {
      return NextResponse.json({ error: 'Report has no content' }, { status: 400 });
    }

    // 上傳到 Google Drive
    const auth = getOAuth2Client();
    const drive = google.drive({ version: 'v3', auth });

    const fileName = `${report.title}.md`;
    const fileMetadata = {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
    };

    const media = {
      mimeType: 'text/markdown',
      body: report.md_content,
    };

    const driveFile = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
    });

    // 更新 Supabase
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        google_drive_file_id: driveFile.data.id,
        google_drive_link: driveFile.data.webViewLink,
        drive_sync_status: 'synced',
        drive_synced_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (updateError) {
      console.error('Failed to update report:', updateError);
    }

    return NextResponse.json({
      success: true,
      fileId: driveFile.data.id,
      fileName: driveFile.data.name,
      link: driveFile.data.webViewLink,
      reportId,
    });
  } catch (error: any) {
    console.error('Google Drive upload error:', error);
    
    // 記錄錯誤到資料庫
    try {
      const body = await request.json();
      const supabase = await createClient();
      await supabase
        .from('reports')
        .update({
          drive_sync_status: 'failed',
          drive_sync_error: error.message,
        })
        .eq('id', body.reportId);
    } catch {}

    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

// PUT - 批量同步多個報告
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportIds } = body;

    if (!reportIds || !Array.isArray(reportIds)) {
      return NextResponse.json({ error: 'reportIds array is required' }, { status: 400 });
    }

    if (reportIds.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 reports per batch' }, { status: 400 });
    }

    const results = [];
    const auth = getOAuth2Client();
    const drive = google.drive({ version: 'v3', auth });
    const supabase = await createClient();

    for (const reportId of reportIds) {
      try {
        const { data: report } = await supabase
          .from('reports')
          .select('*')
          .eq('id', reportId)
          .single();

        if (!report || !report.md_content) {
          results.push({ reportId, success: false, error: 'No content' });
          continue;
        }

        const fileName = `${report.title}.md`;
        const fileMetadata = {
          name: fileName,
          parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
        };

        const media = {
          mimeType: 'text/markdown',
          body: report.md_content,
        };

        const driveFile = await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id, webViewLink',
        });

        await supabase
          .from('reports')
          .update({
            google_drive_file_id: driveFile.data.id,
            google_drive_link: driveFile.data.webViewLink,
            drive_sync_status: 'synced',
            drive_synced_at: new Date().toISOString(),
          })
          .eq('id', reportId);

        results.push({
          reportId,
          success: true,
          fileId: driveFile.data.id,
          link: driveFile.data.webViewLink,
        });
      } catch (error: any) {
        await supabase
          .from('reports')
          .update({
            drive_sync_status: 'failed',
            drive_sync_error: error.message,
          })
          .eq('id', reportId);

        results.push({
          reportId,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      total: reportIds.length,
      success: successCount,
      failed: failCount,
      results,
    });
  } catch (error: any) {
    console.error('Batch sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Batch sync failed' },
      { status: 500 }
    );
  }
}
