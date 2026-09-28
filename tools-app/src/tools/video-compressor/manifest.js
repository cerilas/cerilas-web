export const videoCompressorManifest = {
  slug: 'video-compressor',
  title: 'Video Compressor',
  shortDescription: 'Compress MP4, WebM, and MOV videos 100% locally in your browser. Multi-level quality presets, trimming, audio muting, side-by-side comparison player, and zero file limits.',
  category: 'Optimizer',
  iconName: 'Video',
  badge: '100% Private',
  targetUrl: '#/tool/video-compressor',
  seoTitle: 'Compress MP4, MOV & WebM Online Free (Reduce Video Size in MB) | Cerilas Tools',
  seoDescription: 'Compress MP4, MOV, and WebM video files directly in your web browser. Reduce MP4 file size in MB for Discord (<25MB), WhatsApp (<16MB), and email with 100% private in-browser compression and zero watermarks.',
  features: [
    '100% Client-Side Privacy: Videos never leave your device or touch any external server',
    'Universal Format Support: Compress MP4 (H.264), Apple MOV (QuickTime), WebM (VP9), and MKV',
    'Platform Target Presets: Compress MP4 to under 25MB for Discord and under 16MB for WhatsApp',
    'Smart Quality Presets: Balanced (720p HD), Chat & Email, High Quality (1080p), and Custom Bitrate',
    'Interactive Video Trimmer: Cut unwanted intro and outro frames before compression',
    'Audio Track Management: Keep original audio or mute to maximize file size savings',
    'Side-by-Side Video Player: Inspect original vs compressed results with instant savings badge',
    'Zero File Limits: No registration, no daily quota, and zero file size restrictions'
  ],
  seo: {
    title: "Free Video Compressor Online (100% Private) | Cerilas Tools",
    description: "Compress MP4, WebM, and MOV videos locally in your browser using FFmpeg WebAssembly. Reduce video file sizes for Discord and email with zero cloud uploads.",
    keywords: "video compressor, compress mp4 online, reduce video size, compress video for discord, in-browser video compressor, ffmpeg webassembly, private video compressor",
    ogImage: 'https://tools.cerilas.com/tool-icons/video-compressor.webp',
    ogImageAlt: "Free Video Compressor Online (100% Private) | Cerilas Tools",
    breadcrumbsName: "Video Compressor",
    faq: [
        {
            "q": "How does in-browser video compression work without uploading files?",
            "a": "It utilizes FFmpeg compiled directly to WebAssembly. Your computer's CPU and GPU execute the encoding algorithms locally inside the browser sandbox."
        },
        {
            "q": "Which video formats and containers are supported?",
            "a": "MP4, WebM, MOV, and MKV files. Outputs are encoded with universal H.264 and AAC audio for maximum playback compatibility on mobile and desktop."
        },
        {
            "q": "What is the ideal preset for Discord 25MB limits?",
            "a": "Select the \"Discord / Email 25MB\" preset. The compressor dynamically calculates the target bitrate based on duration to guarantee the file stays under 25MB."
        },
        {
            "q": "Are audio tracks preserved during compression?",
            "a": "Yes. Stereo audio tracks are re-encoded with high-efficiency AAC at 128 kbps, preserving crystal clear voice and music while minimizing size."
        }
    ]
  }
};
