import apiClient from "./client";

// ── Upload Files ─────────────────────────────────────────────
// Note: These use multipart/form-data, so we bypass the JSON default.

export interface FileUploadResponse {
	url: string;
}

async function uploadFile(
	endpoint: string,
	file: { uri: string; name: string; type: string },
): Promise<FileUploadResponse> {
	const formData = new FormData();
	formData.append("file", file as unknown as Blob);

	return apiClient.request<FileUploadResponse>(endpoint, {
		method: "POST",
		body: formData,
	});
}

export function uploadProfileImage(file: {
	uri: string;
	name: string;
	type: string;
}): Promise<FileUploadResponse> {
	return uploadFile("/files/profile-image", file);
}

export function uploadProductImage(file: {
	uri: string;
	name: string;
	type: string;
}): Promise<FileUploadResponse> {
	return uploadFile("/files/product-image", file);
}

export function uploadVendorImage(file: {
	uri: string;
	name: string;
	type: string;
}): Promise<FileUploadResponse> {
	return uploadFile("/files/vendor-image", file);
}

export function uploadRiderDocument(file: {
	uri: string;
	name: string;
	type: string;
}): Promise<FileUploadResponse> {
	return uploadFile("/files/rider-document", file);
}

export function deleteFile(url: string): Promise<void> {
	return apiClient.delete<void>(`/files?url=${encodeURIComponent(url)}`);
}
