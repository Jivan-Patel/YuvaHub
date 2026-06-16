const robustParseJSON = (text: string): any => {
  if (!text) return null;
  try {
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    const lastBrace = text.lastIndexOf('}');
    const lastBracket = text.lastIndexOf(']');

    let start = -1;
    let end = -1;

    const isArray = firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace);
    
    if (isArray) {
      start = firstBracket;
      end = lastBracket;
    } else {
      start = firstBrace;
      end = lastBrace;
    }

    if (start !== -1 && end !== -1 && end > start) {
      const jsonStr = text.substring(start, end + 1);
      return JSON.parse(jsonStr);
    }
    
    return JSON.parse(text);
  } catch (e) {
    console.error("[JSON Parse Error] Raw text:", text);
    return null;
  }
};

async function generatedContentProxy(prompt: string, expectJson: boolean = false) {
  try {
    const res = await fetch("/api/v1/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, expectJson })
    });
    const data = await res.json();
    return data.text || "";
  } catch (e) {
    console.error("AI Proxy Error:", e);
    return "";
  }
}

export async function generateSmartFeed(profile: any, page: number = 1) {
  const prompt = `Return a JSON array of 5 unique student opportunities (internships, hackathons, etc) matching this profile: ${JSON.stringify(profile)}. Page: ${page}. Return JSON ONLY. Schema: [{id, title, type, organization, tags:[], deadline, apply_link, description, match_score}]`;
  const text = await generatedContentProxy(prompt, true);
  const items = robustParseJSON(text);
  if (items && (Array.isArray(items) || Array.isArray(items.items))) {
    return Array.isArray(items) ? items : items.items;
  }
  return [];
}

export async function generateExploreFeed(page: number = 1) {
  const prompt = `Return a JSON array of 5 generic/popular student opportunities globally. Page: ${page}. Return JSON ONLY. Schema: [{id, title, type, organization, tags:[], deadline, apply_link, description}]`;
  const text = await generatedContentProxy(prompt, true);
  const items = robustParseJSON(text);
  if (items && (Array.isArray(items) || Array.isArray(items.items))) {
    return Array.isArray(items) ? items : items.items;
  }
  return [];
}

export async function generateApplyDraft(opportunity: any, profile: any) {
  const prompt = `Write a short professional cover letter draft for: ${opportunity.title} at ${opportunity.organization}. Candidate: ${profile.name}, Skills: ${profile.skills?.join(",")}. Keep it concise.`;
  return await generatedContentProxy(prompt);
}

export async function refineSearchQuery(query: string, profile: any) {
  const prompt = `Refine this search query for a student: "${query}". Profile context: ${profile?.field || 'Tech'}. Return ONLY the refined query string, max 5 words.`;
  const text = await generatedContentProxy(prompt);
  return text.trim() || query;
}

export async function runScoutProtocol(parameters: any, profile: any) {
  const prompt = `Perform a "Scout Protocol" search. Profile: ${JSON.stringify(profile)}, Goals: ${JSON.stringify(parameters)}. Return JSON ONLY: {results: [{title, org, type, deadline, apply_link, match_reason, id}], agent_note: "..."}`;
  const text = await generatedContentProxy(prompt, true);
  return robustParseJSON(text) || { results: [], agent_note: "Search failed." };
}

export async function checkScholarshipEligibility(scholarship: any, profile: any) {
  const prompt = `Can this student apply for this scholarship?\nProfile: ${JSON.stringify(profile)}\nScholarship: ${JSON.stringify(scholarship)}\nReturn JSON ONLY: { eligible: boolean, reasons: string[] }`;
  const text = await generatedContentProxy(prompt, true);
  return robustParseJSON(text) || { eligible: false, reasons: ["Could not verify."] };
}

export async function chatWithMentor(messages: {role: string, content: string}[], message: string) {
  const prompt = `You are an AI Career Mentor for a student. Context of chat:\n${JSON.stringify([...messages, {role: 'user', content: message}])}\nRespond to the latest message. Be concise, encouraging, and provide actionable advice.`;
  return await generatedContentProxy(prompt);
}
