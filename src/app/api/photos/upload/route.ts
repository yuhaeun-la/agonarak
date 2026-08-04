import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called')
    console.log('Cloudinary config:', {
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? '***' : 'missing',
      api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'missing'
    })

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.error('No file in request')
      return NextResponse.json(
        { error: '파일이 없습니다.' },
        { status: 400 }
      )
    }

    console.log('File received:', file.name, file.size, 'bytes', file.type)

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    console.log('Buffer created:', buffer.length, 'bytes')

    // Upload to Cloudinary
    console.log('Starting Cloudinary upload...')
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'agonarak/meetings',
          resource_type: 'auto',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:good' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            reject(error)
          } else if (result) {
            console.log('Cloudinary upload success:', result.secure_url)
            resolve(result)
          } else {
            reject(new Error('Upload failed: no result'))
          }
        }
      )
      uploadStream.end(buffer)
    })

    return NextResponse.json({
      success: true,
      imageUrl: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '업로드에 실패했습니다.' },
      { status: 500 }
    )
  }
}
