import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    // 1. Request validation
    const { imageUrl, clusterName, userId } = await req.json();
    
    if (!imageUrl || !clusterName || !userId) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        details: { 
          imageUrl: !imageUrl, 
          clusterName: !clusterName, 
          userId: !userId 
        } 
      }, { status: 400 });
    }

    // 2. Supabase client initialization with error handling
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Image download with improved error handling
    let response;
    try {
      response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': 'https://www.pinterest.com/'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Validate content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

    } catch (err) {
      console.error('Image fetch failed:', err, { imageUrl });
      return NextResponse.json({ 
        error: 'Image fetch failed', 
        details: String(err),
        imageUrl 
      }, { status: 500 });
    }

    // 4. Convert image to buffer
    let buffer;
    try {
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      
      // Validate buffer size (e.g., max 5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        throw new Error('Image too large (max 5MB)');
      }
    } catch (err) {
      console.error('Buffer conversion failed:', err);
      return NextResponse.json({ 
        error: 'Image processing failed', 
        details: String(err) 
      }, { status: 500 });
    }

    // 5. Upload to Supabase Storage
    const fileName = `${userId}_${encodeURIComponent(clusterName)}_${Date.now()}.jpg`;
    try {
      const { error: uploadError } = await supabase.storage
        .from('cluster-images')
        .upload(fileName, buffer, { 
          contentType: 'image/jpeg', 
          upsert: true 
        });

      if (uploadError) {
        throw uploadError;
      }

      // 6. Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('cluster-images')
        .getPublicUrl(fileName);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      return NextResponse.json({ 
        publicUrl: publicUrlData.publicUrl,
        fileName 
      });

    } catch (err) {
      console.error('Storage upload failed:', err);
      return NextResponse.json({ 
        error: 'Storage upload failed', 
        details: String(err),
        fileName 
      }, { status: 500 });
    }

  } catch (err) {
    console.error('Unexpected error in save-cluster-image:', err);
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: String(err) 
    }, { status: 500 });
  }
} 