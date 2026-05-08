/**
 * Finalized Frontend Fetch Architecture
 * This replaces direct Gemini calls for the feed and delegates logic to the FastAPI backend.
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://api.yuvahub.xyz/api/v1";

export async function fetchSmartFeed(page: number = 1, limit: number = 20) {
  // In production, attach Firebase Auth JWT in headers
  try {
    const response = await fetch(`${API_BASE_URL}/feed/smart?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("RATE_LIMIT");
      throw new Error("API_ERROR");
    }

    return await response.json();
  } catch (error) {
    console.error("Smart Feed Fetch Error:", error);
    throw error; 
  }
}

export async function trackInteraction(opportunityId: string, actionType: 'view' | 'click' | 'save' | 'apply') {
  try {
    const response = await fetch(`${API_BASE_URL}/interactions/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ opportunity_id: opportunityId, action_type: actionType })
    });
    return response.ok;
  } catch (e) {
    // Fire and forget, don't break UI for tracking failures
    console.warn("Failed to track interaction", e);
    return false;
  }
}
