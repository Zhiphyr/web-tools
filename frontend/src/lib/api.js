const API_URL = import.meta.env.VITE_API_URL;

async function parseErrorMessage(res) {
  try {
    const data = await res.json();
    return { message: data.detail || "Ocurrió un error inesperado.", status: res.status };
  } catch {
    return { message: "Ocurrió un error inesperado.", status: res.status };
  }
}

function filenameFromContentDisposition(header, fallback) {
  if (!header) return fallback;
  const match =
    header.match(/filename\*=UTF-8''([^;]+)/i) || header.match(/filename="?([^";]+)"?/i);
  return match ? decodeURIComponent(match[1]) : fallback;
}

export async function checkHealth() {
  const start = performance.now();
  try {
    const res = await fetch(`${API_URL}/status`);
    const elapsed = performance.now() - start;
    return { ok: res.ok, elapsed };
  } catch {
    const elapsed = performance.now() - start;
    return { ok: false, elapsed };
  }
}

export async function getVideoInfo(url) {
  const res = await fetch(`${API_URL}/video-info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const { message, status } = await parseErrorMessage(res);
    throw new Error(message, { cause: { status } });
  }
  return res.json();
}

async function downloadFile(endpoint, body, fallbackName, onProgress) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const { message, status } = await parseErrorMessage(res);
    throw new Error(message, { cause: { status } });
  }

  const filename = filenameFromContentDisposition(
    res.headers.get("Content-Disposition"),
    fallbackName,
  );

  const total = Number(res.headers.get("Content-Length")) || 0;
  const chunks = [];
  let received = 0;

  if (res.body && total > 0) {
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      onProgress?.(Math.min(99, Math.round((received / total) * 100)));
    }
  } else {
    chunks.push(new Uint8Array(await res.arrayBuffer()));
  }

  onProgress?.(100);

  const blob = new Blob(chunks);
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}

export function downloadVideo(url, height, onProgress) {
  return downloadFile("/download/video", { url, height }, "video.mp4", onProgress);
}

export function downloadAudio(url, quality, onProgress) {
  const ext = quality === "wav" ? "wav" : "mp3";
  return downloadFile("/download/audio", { url, quality }, `audio.${ext}`, onProgress);
}

export function downloadInstagramMedia(downloadUrl, title, isVideo, onProgress) {
  const ext = isVideo ? "mp4" : "jpg";
  return downloadFile(
    "/instagram-fallback/download",
    { url: downloadUrl, filename: title, is_video: isVideo },
    `instagram-media.${ext}`,
    onProgress,
  );
}

export async function getInstagramFallback(url) {
  const res = await fetch(`${API_URL}/instagram-fallback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const { message, status } = await parseErrorMessage(res);
    throw new Error(message, { cause: { status } });
  }
  return res.json();
}
