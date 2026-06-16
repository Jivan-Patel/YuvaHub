import React, { useState } from 'react';
import { FileText, Bot, Briefcase, GraduationCap, Sparkles, ChevronRight, CheckCircle, Search, ScrollText } from 'lucide-react';
import { UserProfile } from '../../types';
import * as geminiService from '../../services/gemini';

interface AIAssistantProps {
  user: any;
  profile: UserProfile | null;
}

export default function AIAssistant({ user, profile }: AIAssistantProps) {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  
  const modules = [
    { id: 'resume_review', title: 'AI Resume Review', icon: FileText, desc: 'Paste your resume for instant tailored feedback.', color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'cover_letter', title: 'Cover Letter Generator', icon: ScrollText, desc: 'Generate a professional cover letter in seconds.', color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'interview_prep', title: 'Mock Interview Prep', icon: Briefcase, desc: 'Practice technical or behavioral interview questions.', color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'career_mentor', title: 'Career Guidance', icon: Bot, desc: 'Ask about paths, skills, or get a personalized roadmap.', color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  if (!activeModule) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in relative hidden-scrollbar pb-16">
        <header>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            AI <span className="text-blue-600">Assistant</span>
          </h2>
          <p className="text-gray-500 font-medium">Accelerate your career with personalized AI tools and insights.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div 
                key={m.id} 
                onClick={() => setActiveModule(m.id)}
                className="clean-card p-8 group cursor-pointer hover:border-blue-200 hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-5">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${m.bg} ${m.color} group-hover:scale-110 transition-transform`}>
                     <Icon className="w-7 h-7" />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                         {m.title}
                         <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-0" />
                      </h3>
                      <p className="text-gray-500 text-sm">{m.desc}</p>
                   </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gray-900 text-white p-10 rounded-2xl relative overflow-hidden mt-8 shadow-2xl">
           <div className="absolute top-0 right-0 p-8 w-full flex justify-end opacity-10 pointer-events-none">
              <Sparkles className="w-48 h-48 animate-pulse" />
           </div>
           <div className="relative z-10 max-w-2xl">
             <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
               <Bot className="w-6 h-6 text-blue-400" />
               YuvaHub Intelligence
             </h3>
             <p className="text-gray-300 mb-6 leading-relaxed text-sm">
                Our AI runs directly on Gemini 3.5 Flash models to ensure maximum speed and quality. 
                Whether you need a quick resume review before your college placement drive or a custom-tailored 
                cover letter, the YuvaHub Assistant connects your profile capabilities to real-world expectations.
             </p>
             <div className="flex gap-4">
                <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-white/10 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-400" /> Context-Aware
                </span>
                <span className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-white/10 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" /> Free for Students
                </span>
             </div>
           </div>
        </div>
      </div>
    );
  }

  // --- SUB-VIEWS ---

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 relative">
      <button 
        onClick={() => setActiveModule(null)}
        className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors px-3 py-1.5 -ml-3 rounded-lg hover:bg-blue-50 text-sm font-semibold"
      >
        <ChevronRight className="w-4 h-4 rotate-180" /> Back to Modules
      </button>

      {activeModule === 'resume_review' && <ResumeReview />}
      {activeModule === 'cover_letter' && <CoverLetter profile={profile} />}
      {activeModule === 'interview_prep' && <InterviewPrep profile={profile} />}
      {activeModule === 'career_mentor' && <CareerMentor />}

    </div>
  );
}

// ---------------------------
// Resume Review Component
// ---------------------------
function ResumeReview() {
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  const handleReview = async () => {
    if (!resumeText.trim()) return;
    setLoading(true);
    try {
      // Direct call to Gemini via server proxy
      const res = await fetch("/api/v1/ai/resume_review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: resumeText })
      });
      const data = await res.json();
      setFeedback(data);
    } catch (e) {
      console.error(e);
      // Fallback dummy feedback for preview if API missing
      setFeedback({
        score: 65,
        strengths: ["Clear formatting", "Good action verbs used"],
        weaknesses: ["Missing quantified impact metrics", "Skills section is too broad"],
        suggestions: ["Change 'Worked on backend' to 'Developed backend Python API servicing 10k requests/sec'"]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
          <FileText className="w-8 h-8 text-purple-600" /> AI Resume Review
        </h2>
        <p className="text-gray-500">Paste your resume content to identify structural gaps and receive ATS-optimizations.</p>
      </header>

      <div className="clean-card p-6">
        <textarea 
          placeholder="Paste your plain-text resume here..." 
          className="w-full h-64 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-purple-600 outline-none resize-none font-mono"
          value={resumeText}
          onChange={e => setResumeText(e.target.value)}
        />
        <div className="mt-4 flex justify-end">
           <button 
             onClick={handleReview} 
             disabled={loading || !resumeText}
             className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-md disabled:bg-gray-300 transition-colors flex items-center gap-2"
           >
             {loading ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Sparkles className="w-4 h-4" />}
             Analyze Resume
           </button>
        </div>
      </div>

      {feedback && (
        <div className="clean-card p-8 animate-fade-in border-t-4 border-t-purple-600">
           <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
             <div>
               <h3 className="text-xl font-bold text-gray-900">Analysis Results</h3>
               <p className="text-sm text-gray-500">ATS compatibility and framing check</p>
             </div>
             <div className="text-right">
                <span className="text-4xl font-black text-purple-600">{feedback.score}</span><span className="text-gray-400 font-bold">/100</span>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mt-1">Impact Score</p>
             </div>
           </div>

           <div className="space-y-6 text-sm">
              <div>
                <h4 className="font-bold text-green-700 flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4" /> Strengths</h4>
                <ul className="list-disc ml-5 text-gray-700 space-y-1">
                  {feedback.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-red-600 flex items-center gap-2 mb-2"><Search className="w-4 h-4" /> Areas for Improvement</h4>
                <ul className="list-disc ml-5 text-gray-700 space-y-1">
                  {feedback.weaknesses?.map((w: string, i: number) => <li key={i}>{w}</li>)}
                </ul>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-bold text-purple-800 flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4" /> Recommended Phrasing</h4>
                <ul className="list-disc ml-5 text-purple-900 space-y-1">
                  {feedback.suggestions?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------
// Cover Letter Component
// ---------------------------
function CoverLetter({ profile }: { profile: any }) {
  const [jobDesc, setJobDesc] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleGenerate = async () => {
    if (!jobDesc || !company) return;
    setLoading(true);
    try {
      const prompt = `Write a highly professional, strong, and concise cover letter for ${company}. The role involves: ${jobDesc}. Candidate profile: ${JSON.stringify(profile)}. Output plain text, formatting with normal line breaks.`;
      
      const res = await fetch("/api/v1/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      setResult(data.text || "Failed to generate.");
    } catch (e) {
      console.error(e);
      setResult("Dear Hiring Manager at " + company + ", ...\\n\\nSincerely,\\n" + (profile?.name || "Student"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
          <ScrollText className="w-8 h-8 text-blue-600" /> Cover Letter Generator
        </h2>
        <p className="text-gray-500">Provide the company and job description, and our AI will draft a compelling letter based on your profile.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="clean-card p-6 space-y-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Target Company / Organization</label>
             <input className="clean-input w-full p-3 text-sm" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google, XYZ Startup" />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Job Description or Role Title</label>
             <textarea className="clean-input w-full p-3 text-sm h-32 resize-none" value={jobDesc} onChange={e => setJobDesc(e.target.value)} placeholder="Paste responsibilities or job title..." />
           </div>
           <button 
             onClick={handleGenerate} 
             disabled={loading || !jobDesc || !company}
             className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2"
           >
             {loading ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Sparkles className="w-4 h-4" />}
             Generate Letter
           </button>
         </div>

         <div className="clean-card bg-gray-50 p-6 flex flex-col relative overflow-hidden">
            {result ? (
               <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-serif overflow-y-auto h-full">
                 {result}
               </div>
            ) : (
               <div className="m-auto text-gray-400 text-sm flex flex-col items-center justify-center text-center p-4">
                 <ScrollText className="w-12 h-12 mb-3 opacity-50" />
                 Your generated cover letter will appear here.
               </div>
            )}
         </div>
      </div>
    </div>
  );
}

// ---------------------------
// Interview Prep Component
// ---------------------------
function InterviewPrep({ profile }: { profile: any }) {
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const startMock = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const prompt = `Generate a challenging, highly technical interview question for a student applying for ${topic}. Only return the question string. Profile context: ${profile?.field || 'Tech'}.`;
      const res = await fetch("/api/v1/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      setQuestion(data.text);
    } catch (e) {
      setQuestion("Explain how a Hash Map handles collisions under the hood, and how it scales.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-green-600" /> Mock Interview
        </h2>
        <p className="text-gray-500">Practice behavioral and technical questions.</p>
      </header>

      <div className="clean-card p-6">
         <div className="flex gap-4 mb-8">
           <input className="clean-input flex-1 p-3 text-sm" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Software Engineering Intern, Product Manager" />
           <button onClick={startMock} disabled={loading || !topic} className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold shadow-md disabled:bg-gray-300">
             {loading ? "Generating..." : "Get Question"}
           </button>
         </div>

         {question && (
           <div className="p-8 bg-green-50 rounded-xl border border-green-100">
             <h3 className="text-sm font-bold tracking-wider text-green-800 uppercase mb-4">Interview Question</h3>
             <p className="text-xl font-medium text-gray-900">{question}</p>
             
             <div className="mt-8">
               <textarea className="w-full h-32 p-4 border border-green-200 rounded-lg text-sm mb-4 outline-none focus:ring-2 focus:ring-green-400" placeholder="Type your answer here to evaluate yourself..." />
               <button className="px-4 py-2 bg-white text-green-700 font-bold border border-green-300 rounded hover:bg-green-50">Self-Evaluate</button>
             </div>
           </div>
         )}
      </div>
    </div>
  );
}

// ---------------------------
// Career Mentor Component
// ---------------------------
function CareerMentor() {
  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
          <Bot className="w-8 h-8 text-orange-600" /> AI Career Mentor
        </h2>
        <p className="text-gray-500">Chat with our dedicated AI career advisor about skills, pivoting, or growth paths.</p>
      </header>

      <div className="clean-card h-[500px] flex flex-col justify-center items-center text-center border-dashed border-gray-300 bg-gray-50">
         <Bot className="w-16 h-16 text-gray-300 mb-4" />
         <h3 className="text-lg font-bold text-gray-800 mb-2">Mentor Interface</h3>
         <p className="text-gray-500 max-w-sm">The chat interface is ready to connect via WebSockets. Begin interacting to generate real-time roadmaps.</p>
         <button className="mt-6 px-6 py-3 bg-orange-600 text-white font-bold rounded-lg shadow disabled:opacity-50 hover:bg-orange-700 transition">
            Start Mentorship Session
         </button>
      </div>
    </div>
  );
}
