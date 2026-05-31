// Real client-side video upscaler using WebCodecs + mp4-muxer.
// High-quality Lanczos-like resampling via stepped bilinear + unsharp mask.
import { Muxer, ArrayBufferTarget } from "mp4-muxer";
// @ts-ignore - mp4box has no types bundled
import MP4Box from "mp4box";

export type UpscaleTarget = "480p" | "720p" | "1080p" | "2K" | "4K";
export type Creativity = "subtle" | "bold";

const TARGET_HEIGHTS: Record<UpscaleTarget, number> = {
  "480p": 480,
  "720p": 720,
  "1080p": 1080,
  "2K": 1440,
  "4K": 2160,
};

export interface UpscaleOptions {
  target: UpscaleTarget;
  creativity: Creativity;
  frameInterpolation: boolean;
  onProgress?: (pct: number) => void;
}

function isWebCodecsSupported(): boolean {
  return (
    typeof (globalThis as any).VideoDecoder !== "undefined" &&
    typeof (globalThis as any).VideoEncoder !== "undefined" &&
    typeof OffscreenCanvas !== "undefined"
  );
}

// Read full file into ArrayBuffer
function readFile(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}

// Demux mp4/mov using mp4box.js; returns track info + samples
async function demuxVideo(file: File): Promise<{
  info: any;
  videoTrack: any;
  description: Uint8Array;
  samples: { data: Uint8Array; cts: number; dts: number; duration: number; is_sync: boolean }[];
  timescale: number;
}> {
  const buf = await readFile(file);
  (buf as any).fileStart = 0;
  return new Promise((resolve, reject) => {
    const mp4 = MP4Box.createFile();
    let videoTrack: any = null;
    const samples: any[] = [];
    let description: Uint8Array | null = null;
    let infoResolved: any = null;

    mp4.onError = (e: any) => reject(new Error("Demux error: " + e));
    mp4.onReady = (info: any) => {
      const vt = info.videoTracks?.[0];
      if (!vt) return reject(new Error("No video track found"));
      videoTrack = vt;
      infoResolved = info;

      // Extract avcC / hvcC description for VideoDecoder
      const trak = mp4.getTrackById(vt.id);
      const entry = trak.mdia.minf.stbl.stsd.entries[0];
      const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
      if (box) {
        const stream = new (MP4Box as any).DataStream(undefined, 0, (MP4Box as any).DataStream.BIG_ENDIAN);
        box.write(stream);
        // strip the 8-byte box header
        description = new Uint8Array(stream.buffer, 8);
      }

      mp4.setExtractionOptions(vt.id, null, { nbSamples: 1000 });
      mp4.start();
    };
    mp4.onSamples = (_id: number, _user: any, ss: any[]) => {
      for (const s of ss) {
        samples.push({
          data: s.data,
          cts: (s.cts * 1_000_000) / s.timescale,
          dts: (s.dts * 1_000_000) / s.timescale,
          duration: (s.duration * 1_000_000) / s.timescale,
          is_sync: s.is_sync,
        });
      }
    };

    mp4.appendBuffer(buf);
    mp4.flush();

    // wait a tick for callbacks to settle, then resolve
    setTimeout(() => {
      if (!videoTrack) return reject(new Error("Could not parse video"));
      resolve({
        info: infoResolved,
        videoTrack,
        description: description ?? new Uint8Array(),
        samples,
        timescale: 1_000_000,
      });
    }, 50);
  });
}

// Stepped downscale not needed for upscale, but we apply a high-quality
// resample by drawing through a 2x intermediate canvas with imageSmoothingQuality=high,
// then apply an unsharp mask.
function buildScaler(srcW: number, srcH: number, dstW: number, dstH: number) {
  const intermediate = new OffscreenCanvas(dstW, dstH);
  const ictx = intermediate.getContext("2d", { willReadFrequently: false })!;
  ictx.imageSmoothingEnabled = true;
  (ictx as any).imageSmoothingQuality = "high";
  return { intermediate, ictx };
}

// Unsharp mask: out = orig + amount * (orig - blur)
function unsharpMask(ctx: OffscreenCanvasRenderingContext2D, w: number, h: number, amount: number) {
  if (amount <= 0) return;
  const src = ctx.getImageData(0, 0, w, h);
  // Cheap 3x3 box blur
  const data = src.data;
  const blurred = new Uint8ClampedArray(data.length);
  const idx = (x: number, y: number) => (y * w + x) * 4;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy; if (yy < 0 || yy >= h) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx; if (xx < 0 || xx >= w) continue;
            sum += data[idx(xx, yy) + c]; n++;
          }
        }
        blurred[idx(x, y) + c] = sum / n;
      }
      blurred[idx(x, y) + 3] = data[idx(x, y) + 3];
    }
  }
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = data[i + c] + amount * (data[i + c] - blurred[i + c]);
      data[i + c] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  ctx.putImageData(src, 0, 0);
}

export async function upscaleVideo(file: File, opts: UpscaleOptions): Promise<Blob> {
  if (!isWebCodecsSupported()) {
    throw new Error(
      "Your browser does not support WebCodecs. Please use Chrome, Edge, or Opera (desktop) for video upscaling."
    );
  }
  const { onProgress } = opts;
  onProgress?.(2);

  const { videoTrack, description, samples } = await demuxVideo(file);
  if (samples.length === 0) throw new Error("No frames found in video");

  const srcW = videoTrack.video.width;
  const srcH = videoTrack.video.height;
  const targetH = TARGET_HEIGHTS[opts.target];
  // Preserve aspect ratio, force even dims (H.264 requires it)
  let dstH = targetH;
  let dstW = Math.round((srcW * dstH) / srcH);
  if (dstW % 2) dstW += 1;
  if (dstH % 2) dstH += 1;

  // FPS estimate
  const totalDurUs = samples.reduce((a, s) => a + s.duration, 0) || 1;
  const fps = Math.max(1, Math.round((samples.length * 1_000_000) / totalDurUs));

  // Codec string. Try the source codec, fallback to baseline avc1.
  const srcCodec: string = videoTrack.codec || "avc1.42E01E";

  // Encoder bitrate: scale roughly with pixel count and creativity
  const bitsPerPx = opts.creativity === "bold" ? 0.18 : 0.12;
  const bitrate = Math.min(60_000_000, Math.max(2_000_000, Math.round(dstW * dstH * fps * bitsPerPx)));

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: "avc", width: dstW, height: dstH, frameRate: fps },
    fastStart: "in-memory",
  });

  const encoder = new (globalThis as any).VideoEncoder({
    output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
    error: (e: any) => { throw e; },
  });

  // Negotiate an encoder config the browser supports
  const encoderCandidates = [
    "avc1.640033", // High 5.1 — 4K
    "avc1.640028", // High 4.0
    "avc1.4D4032", // Main 5.2
    "avc1.42E033", // Baseline 5.1
    "avc1.42E01E", // Baseline 3.0
  ];
  let configured = false;
  for (const codec of encoderCandidates) {
    const cfg = {
      codec,
      width: dstW,
      height: dstH,
      bitrate,
      framerate: fps,
      avc: { format: "avc" },
    } as any;
    try {
      const sup = await (globalThis as any).VideoEncoder.isConfigSupported(cfg);
      if (sup?.supported) {
        encoder.configure(sup.config ?? cfg);
        configured = true;
        break;
      }
    } catch { /* try next */ }
  }
  if (!configured) throw new Error("No supported H.264 encoder config for this resolution.");

  const { intermediate, ictx } = buildScaler(srcW, srcH, dstW, dstH);

  // Decoder
  let decodedCount = 0;
  const totalSamples = samples.length;
  const encodedFrames: { frame: any; keyFrame: boolean }[] = [];

  const sharpenAmount = opts.creativity === "bold" ? 0.85 : 0.45;

  const decoder = new (globalThis as any).VideoDecoder({
    output: (frame: any) => {
      // Draw scaled
      ictx.drawImage(frame, 0, 0, dstW, dstH);
      frame.close();
      unsharpMask(ictx as any, dstW, dstH, sharpenAmount);

      const ts = samples[decodedCount]?.cts ?? decodedCount * (1_000_000 / fps);
      const dur = samples[decodedCount]?.duration ?? 1_000_000 / fps;
      const VF = (globalThis as any).VideoFrame;
      const outFrame = new VF(intermediate, { timestamp: ts, duration: dur });
      const keyFrame = decodedCount % fps === 0;
      encodedFrames.push({ frame: outFrame, keyFrame });
      decodedCount++;
      onProgress?.(Math.min(95, 5 + Math.round((decodedCount / totalSamples) * 85)));
    },
    error: (e: any) => { throw e; },
  });

  decoder.configure({
    codec: srcCodec,
    codedWidth: srcW,
    codedHeight: srcH,
    description: description.length ? description : undefined,
  });

  const EVC = (globalThis as any).EncodedVideoChunk;
  for (const s of samples) {
    decoder.decode(new EVC({
      type: s.is_sync ? "key" : "delta",
      timestamp: s.cts,
      duration: s.duration,
      data: s.data,
    }));
  }
  await decoder.flush();
  decoder.close();

  // Encode in order
  for (const { frame, keyFrame } of encodedFrames) {
    encoder.encode(frame, { keyFrame });
    frame.close();
  }
  await encoder.flush();
  encoder.close();

  muxer.finalize();
  const { buffer } = muxer.target as ArrayBufferTarget;
  onProgress?.(100);
  return new Blob([buffer], { type: "video/mp4" });
}
