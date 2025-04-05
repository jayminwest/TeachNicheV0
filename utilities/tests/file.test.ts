/**
 * Tests for file handling utilities
 */

import { refreshVideoUrl, refreshVideoUrlServer, DEFAULT_SIGNED_URL_EXPIRY } from "../file/video";
import { uploadFile, createSignedUrl, deleteFile } from "../file/storage";

// Mock Supabase client for testing
const mockSupabaseClient = {
  storage: {
    from: jest.fn().mockImplementation(() => ({
      createSignedUrl: jest.fn().mockResolvedValue({
        data: { signedUrl: "https://example.com/signed-url" },
        error: null
      }),
      upload: jest.fn().mockResolvedValue({
        data: { path: "test/path.mp4" },
        error: null
      }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: "https://example.com/public-url" }
      }),
      remove: jest.fn().mockResolvedValue({
        error: null
      })
    }))
  }
};

// Mock window.sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
};

// Mock createClientComponentClient
jest.mock("@supabase/auth-helpers-nextjs", () => ({
  createClientComponentClient: jest.fn().mockImplementation(() => mockSupabaseClient)
}));

describe("Video file handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup sessionStorage mock
    global.sessionStorage = mockSessionStorage as any;
    global.window = { sessionStorage: mockSessionStorage } as any;
  });

  test("refreshVideoUrl handles empty url", async () => {
    const result = await refreshVideoUrl("");
    expect(result).toBe("");
  });

  test("refreshVideoUrl refreshes signed URLs", async () => {
    const url = "https://example.com/storage/v1/object/sign/videos/user123/video.mp4?token=abc";
    const result = await refreshVideoUrl(url);
    
    expect(result).toBe("https://example.com/signed-url");
    expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith("videos");
  });

  test("refreshVideoUrl creates signed URL from path", async () => {
    const path = "user123/video.mp4";
    const result = await refreshVideoUrl(path);
    
    expect(result).toBe("https://example.com/signed-url");
    expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith("videos");
    expect(mockSessionStorage.setItem).toHaveBeenCalled();
  });

  test("refreshVideoUrl uses cached URL when available", async () => {
    const path = "user123/video.mp4";
    const cachedUrl = "https://example.com/cached-url";
    
    // Setup cache hit
    mockSessionStorage.getItem.mockImplementation((key) => {
      if (key === `video_url_${path}`) return cachedUrl;
      if (key === `video_url_${path}_timestamp`) return Date.now().toString();
      return null;
    });
    
    const result = await refreshVideoUrl(path);
    
    expect(result).toBe(cachedUrl);
    expect(mockSupabaseClient.storage.from).not.toHaveBeenCalled();
  });

  test("DEFAULT_SIGNED_URL_EXPIRY is set to 30 days in seconds", () => {
    expect(DEFAULT_SIGNED_URL_EXPIRY).toBe(2592000); // 30 days in seconds
  });
});

describe("Storage utilities", () => {
  test("uploadFile uploads files successfully", async () => {
    const file = new File(["test content"], "test.mp4", { type: "video/mp4" });
    
    const result = await uploadFile(
      mockSupabaseClient as any,
      "videos",
      "user123/test.mp4",
      file
    );
    
    expect(result.url).toBe("https://example.com/public-url");
    expect(result.error).toBeNull();
    expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith("videos");
  });

  test("createSignedUrl creates a signed URL", async () => {
    const result = await createSignedUrl(
      mockSupabaseClient as any,
      "videos",
      "user123/test.mp4"
    );
    
    expect(result).toBe("https://example.com/signed-url");
    expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith("videos");
  });

  test("deleteFile deletes a file", async () => {
    const result = await deleteFile(
      mockSupabaseClient as any,
      "videos",
      "user123/test.mp4"
    );
    
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith("videos");
  });
});
