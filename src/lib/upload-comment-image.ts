export async function uploadCommentImage(file: File | Blob): Promise<string> {
  const contentType = file.type || "image/jpeg";
  const res = await fetch("/api/comment-image-upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType }),
  });
  if (!res.ok) throw new Error("Could not get upload URL");
  const { uploadUrl, key } = await res.json();

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!putRes.ok) throw new Error("Upload failed");

  return key;
}
