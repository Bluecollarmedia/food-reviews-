export async function uploadAvatar(file: File): Promise<string> {
  const res = await fetch("/api/avatar-upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type }),
  });
  if (!res.ok) throw new Error("Could not get upload URL");
  const { uploadUrl, key } = await res.json();

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putRes.ok) throw new Error("Upload failed");

  return key;
}
