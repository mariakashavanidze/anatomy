import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, BookOpen, Brain, Activity, Droplet, Wind, HeartPulse, Egg, ShieldAlert,
  CheckCircle2, ChevronRight, RefreshCcw, Home, Award, XCircle, Info, Lightbulb, User, Clock, AlertCircle, Trophy, Medal
} from 'lucide-react';
import { topics, quizQuestions, funFacts, Topic, Section, QuizQuestion } from './data';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const interactiveOrgansData = [
  { id: 'brain', title: 'თავის ქალა და ტვინი', text: 'ტვინი მართვის ცენტრია. მას თავის ქალა იცავს.', Icon: Brain, top: 0, left: '50%', color: 'text-purple-300', bg: 'bg-purple-400/20', borderColor: 'border-purple-400/50' },
  { id: 'lungs', title: 'ფილტვები', text: 'ჩვენი სასუნთქი სისტემა. დაცულია ნეკნებით.', Icon: Wind, top: 70, left: '50%', color: 'text-sky-300', bg: 'bg-sky-400/20', borderColor: 'border-sky-400/50' },
  { id: 'heart', title: 'გული', text: 'იკუმშება 100,000-ჯერ დღეში და აწვდის სისხლს.', Icon: HeartPulse, top: 110, left: '35%', color: 'text-rose-400', bg: 'bg-rose-400/20', borderColor: 'border-rose-400/50' },
  { id: 'stomach', title: 'მომნელებელი სისტემა', text: 'კუჭი და ნაწლავები საკვებს ინელებენ.', Icon: Activity, top: 165, left: '50%', color: 'text-amber-300', bg: 'bg-amber-400/20', borderColor: 'border-amber-400/50' },
  { id: 'kidneys', title: 'თირკმელები', text: 'ასუფთავებენ სისხლს მავნე ნივთიერებებისგან.', Icon: Droplet, top: 225, left: '50%', color: 'text-teal-300', bg: 'bg-teal-400/20', borderColor: 'border-teal-400/50' },
];

type ViewState = 'home' | 'learn' | 'quiz' | 'topic';
type QuizStatus = 'idle' | 'playing' | 'failed_time' | 'failed_score' | 'passed';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  
  // Leaderboard / User State
  const [userName, setUserName] = useState<string>('');
  const [userBestScore, setUserBestScore] = useState<number>(0);

  useEffect(() => {
    const savedName = localStorage.getItem('explorer_user_name');
    const savedScore = localStorage.getItem('explorer_user_score');
    if (savedName) setUserName(savedName);
    if (savedScore) setUserBestScore(parseInt(savedScore, 10));
  }, []);

  const saveScore = (newScore: number) => {
    if (newScore > userBestScore) {
      setUserBestScore(newScore);
      localStorage.setItem('explorer_user_score', newScore.toString());
      if (!userName) {
         const newName = prompt("გილოცავთ! თქვენ დააფიქსირეთ ახალი რეკორდი! შეიყვანეთ სახელი:") || "უცნობი მკვლევარი";
         setUserName(newName);
         localStorage.setItem('explorer_user_name', newName);
      }
    }
  };

  // Quiz State
  const [quizStatus, setQuizStatus] = useState<QuizStatus>('idle');
  const [currentQuizTopic, setCurrentQuizTopic] = useState<string | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);

  const [currentFact, setCurrentFact] = useState(funFacts[0]);
  const [activeOrgan, setActiveOrgan] = useState<string | null>('brain');
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFact(funFacts[Math.floor(Math.random() * funFacts.length)]);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // Strict Timer Logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentView === 'quiz' && quizStatus === 'playing' && !hasAnsweredCurrent) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setHasAnsweredCurrent(true);
            setQuizStatus('failed_time');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentView, quizStatus, hasAnsweredCurrent]);

  const handleTopicClick = (id: string) => {
    setSelectedTopic(id);
    setCurrentView('topic');
    setCompletedTopics(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const initQuizView = (topicId: string | null = null) => {
    setCurrentQuizTopic(topicId);
    setQuizStatus('idle');
    setCurrentView('quiz');
  };

  const startQuiz = () => {
    let pool = currentQuizTopic 
                 ? quizQuestions.filter(q => q.topicId === currentQuizTopic) 
                 : quizQuestions;
                 
    // Fisher-Yates shuffle
    let shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Select questions
    const selected = shuffled.slice(0, 10);
    
    setActiveQuestions(selected);
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswers(new Array(selected.length).fill(-1));
    setHasAnsweredCurrent(false);
    setTimeLeft(15);
    setQuizStatus('playing');
  };

  const answerQuestion = (index: number) => {
    if (hasAnsweredCurrent || quizStatus !== 'playing') return;
    
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = index;
    setAnswers(newAnswers);
    setHasAnsweredCurrent(true);

    if (index === activeQuestions[currentQuestionIndex].answerIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNextClick = () => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex(c => c + 1);
      setHasAnsweredCurrent(false);
      setTimeLeft(15);
    } else {
      // Evaluate result
      const passThreshold = 0.7; // 70% passing
      const passed = (score / activeQuestions.length) >= passThreshold;
      
      const totalPoints = score * 100;
      saveScore(totalPoints);
      
      setQuizStatus(passed ? 'passed' : 'failed_score');
    }
  };

  const getBadge = (scorePerc: number) => {
    if (scorePerc >= 90) return { title: "ექსპერტი", color: "text-amber-500", bg: "bg-amber-100" };
    if (scorePerc >= 70) return { title: "მკვლევარი", color: "text-emerald-500", bg: "bg-emerald-100" };
    return { title: "პრაქტიკანტი", color: "text-blue-500", bg: "bg-blue-100" };
  };

  const renderSection = (section: Section, index: number) => {
    switch(section.type) {
      case 'important':
        return (
          <div key={index} className="bg-rose-50 border-l-4 border-rose-500 p-6 sm:p-8 rounded-r-2xl mb-8">
            <div className="flex items-center gap-2 mb-3 text-rose-800 font-bold uppercase tracking-wide text-sm">
              <ShieldAlert className="w-5 h-5"/>
              <span>{section.title || "მნიშვნელოვანი ინფორმაცია"}</span>
            </div>
            <p className="text-rose-900 leading-relaxed font-medium sm:text-lg">{section.content}</p>
          </div>
        );
      case 'remember':
        return (
          <div key={index} className="bg-indigo-50 p-6 sm:p-8 rounded-2xl mb-8 border border-indigo-100">
            <div className="flex items-center gap-2 mb-3 text-indigo-700 font-bold text-sm uppercase tracking-wide">
              <Lightbulb className="w-5 h-5 text-indigo-500 fill-indigo-200"/>
              <span>{section.title || "დაიმახსოვრე"}</span>
            </div>
            <p className="text-indigo-900 leading-relaxed font-medium sm:text-lg">{section.content}</p>
          </div>
        );
      case 'list':
        return (
          <div key={index} className="mb-8">
            {section.title && <h3 className="text-2xl font-bold font-display text-slate-800 mb-5">{section.title}</h3>}
            <ul className="space-y-4">
              {(section.content as string[]).map((item, i) => (
                <li key={i} className="flex items-start gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-sm font-bold text-slate-600 mt-1">{i+1}</div>
                  <span className="text-slate-700 font-medium leading-relaxed sm:text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      case 'diagram':
        return null; // Omitted for minimalism per visual request, or re-implement if needed.
      case 'text':
      default:
        return (
          <div key={index} className="mb-8">
            {section.title && <h3 className="text-2xl font-bold font-display text-slate-800 mb-4">{section.title}</h3>}
            <p className="text-slate-600 text-lg sm:text-xl leading-relaxed">{section.content}</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-4 cursor-pointer group"
            onClick={() => setCurrentView('home')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-md transform group-hover:rotate-6 transition-all">
              <Bot className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-xl text-slate-800 hidden sm:block tracking-tight group-hover:text-indigo-600 transition-colors">
              ანატომია
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 p-1.5 rounded-full overflow-x-auto hide-scrollbar">
            <button 
              onClick={() => setCurrentView('home')}
              className={cn("px-4 py-2 rounded-full font-bold transition-all md:text-base text-sm whitespace-nowrap", currentView === 'home' ? "bg-white text-indigo-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700")}
            >
              მთავარი
            </button>
            <button 
              onClick={() => {setCurrentView('learn'); setSelectedTopic(null);}}
              className={cn("px-4 py-2 rounded-full font-bold transition-all md:text-base text-sm whitespace-nowrap", currentView === 'learn' || currentView === 'topic' ? "bg-white text-amber-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700")}
            >
              შესწავლა
            </button>
            <button 
              onClick={() => initQuizView(null)}
              className={cn("px-4 py-2 rounded-full font-bold transition-all md:text-base text-sm whitespace-nowrap", currentView === 'quiz' ? "bg-white text-emerald-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700")}
            >
              ქვიზი
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {/* HOME VIEW */}
          {currentView === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="space-y-12 pb-12"
            >
              <div className="py-12 md:py-16 px-6 md:px-10 bg-indigo-900 rounded-[2rem] shadow-xl text-white relative overflow-hidden flex flex-col md:flex-row items-center gap-8 border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/50 to-purple-800/80 z-0"/>
                
                <div className="flex-1 relative z-10 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md mb-6 border border-white/10 text-white text-sm font-bold tracking-wide shadow-sm">
                    <User className="w-4 h-4"/> კლასი 5–8
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black mb-6 leading-tight tracking-tight drop-shadow-md text-white">
                    🧬 <span className="text-amber-300">ადამიანის</span> ანატომია
                  </h1>
                  <p className="text-lg md:text-xl font-medium text-slate-200 max-w-xl mb-8 leading-relaxed">
                    ჩვენი სხეული საოცარი მექანიზმია. შეისწავლეთ ორგანოები, უჯრედები და ორგანოთა სისტემების ჰარმონიული მუშაობა.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                    <button 
                      onClick={() => setCurrentView('learn')}
                      className="px-8 py-4 bg-white text-indigo-900 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all focus:outline-none"
                    >
                      სწავლის დაწყება
                    </button>
                    <button 
                      onClick={() => initQuizView(null)}
                      className="px-8 py-4 bg-black/30 text-white rounded-full font-bold text-lg hover:bg-black/50 transition-all border border-white/20 backdrop-blur-sm focus:outline-none"
                    >
                      ცოდნის შემოწმება
                    </button>
                  </div>
                </div>

                <div className="hidden md:flex w-full md:w-auto flex-1 items-center justify-center lg:justify-end min-h-[320px] z-10">
                   <div className="relative flex items-center justify-center w-full max-w-[400px]">
                      {activeOrgan && (
                         <motion.div 
                           key={activeOrgan}
                           initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                           className="absolute right-[170px] md:right-[190px] top-10 w-48 sm:w-52 p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/20 shadow-2xl z-20 text-left pointer-events-none"
                         >
                           <h4 className="text-amber-300 font-bold text-sm mb-1">{interactiveOrgansData.find(o => o.id === activeOrgan)?.title}</h4>
                           <p className="text-white/90 text-xs leading-relaxed">{interactiveOrgansData.find(o => o.id === activeOrgan)?.text}</p>
                         </motion.div>
                      )}
                      <div className="relative w-32 h-[300px]">
                        <div className="absolute top-[20px] left-1/2 -translate-x-1/2 w-1.5 h-[240px] bg-white/20 rounded-full blur-[1px]" />
                        <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-white/20" />
                        <div className="absolute top-[95px] left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-white/20" />
                        <div className="absolute top-[110px] left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-white/20" />
                        {interactiveOrgansData.map((organ) => {
                          const OrgIcon = organ.Icon;
                          const isActive = activeOrgan === organ.id;
                          return (
                            <div 
                              key={organ.id}
                              style={{ top: `${organ.top}px`, left: organ.left, transform: 'translateX(-50%)' }}
                              className="absolute z-10 cursor-pointer group"
                              onMouseEnter={() => setActiveOrgan(organ.id)}
                            >
                               {isActive && (
                                  <motion.div layoutId="glow" className="absolute -inset-2 rounded-full bg-white/20 blur-md pointer-events-none" />
                               )}
                               <motion.div
                                 animate={{ y: [0, -3, 0] }}
                                 transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                                 className={cn("w-12 h-12 rounded-full flex items-center justify-center border-2 backdrop-blur-md transition-all duration-300", 
                                  isActive ? `${organ.bg} ${organ.borderColor} scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)]` : "bg-black/30 border-white/20 hover:scale-105"
                                 )}
                               >
                                 <OrgIcon className={cn("w-6 h-6", isActive ? "text-white" : organ.color)} />
                               </motion.div>
                            </div>
                          )
                        })}
                      </div>
                   </div>
                </div>
              </div>

              {/* Leaderboard and Fact Card */}
              <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-8">
                  <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 font-display">საუკეთესო მოსწავლეები</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {[
                        ...(userBestScore > 0 ? [{ name: userName || "თქვენ", score: `${userBestScore} ქულა`, badge: userBestScore >= 1200 ? "ექსპერტი" : "მკვლევარი", rawScore: userBestScore }] : []),
                        { name: "გიორგი მ.", score: "1450 ქულა", badge: "ექსპერტი", rawScore: 1450 },
                        { name: "მარიამ ტ.", score: "1300 ქულა", badge: "ექსპერტი", rawScore: 1300 },
                        { name: "ანდრია ჯ.", score: "1100 ქულა", badge: "მკვლევარი", rawScore: 1100 },
                        { name: "ელენე ხ.", score: "900 ქულა", badge: "პრაქტიკანტი", rawScore: 900 }
                      ]
                      .sort((a, b) => b.rawScore - a.rawScore)
                      .slice(0, 4)
                      .map((student, i) => (
                        <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border transition-shadow ${student.name === userName || student.name === "თქვენ" ? "bg-indigo-50 border-indigo-200 shadow-md scale-[1.02]" : "bg-slate-50 border-slate-100 hover:shadow-md"}`}>
                          <div className="flex items-center gap-4">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm", 
                              i === 0 ? "bg-amber-400" : i === 1 ? "bg-slate-400" : i === 2 ? "bg-orange-400" : "bg-indigo-400"
                            )}>
                              {i < 3 ? <Medal className="w-5 h-5"/> : i + 1}
                            </div>
                            <span className="font-bold text-slate-800 text-lg flex items-center gap-2">
                              {student.name}
                              {(student.name === userName || student.name === "თქვენ") && <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">შენ</span>}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 sm:gap-8 text-right">
                            <div className="hidden sm:block">
                              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-0.5">სტატუსი</span>
                              <span className={cn("text-xs font-bold px-2 py-1 rounded-md",
                                student.badge === "ექსპერტი" ? "bg-amber-100 text-amber-600" : student.badge === "მკვლევარი" ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                              )}>{student.badge}</span>
                            </div>
                            <div>
                               <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-0.5">საერთო ჯამი</span>
                               <span className="font-black text-indigo-600 font-mono text-base">{student.score}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 sm:p-8 rounded-3xl shadow-sm border border-indigo-100 h-full flex flex-col">
                    <div className="w-16 h-16 bg-white text-indigo-500 rounded-2xl flex items-center justify-center shadow-sm mb-6 shrink-0">
                      <Bot className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4 font-display">იცით თუ არა?</h3>
                    <p className="text-slate-700 font-medium leading-relaxed drop-shadow-sm flex-1">{currentFact}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* LEARN VIEWS */}
          {currentView === 'learn' && (
            <motion.div 
              key="learn"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="pb-12"
            >
              <div className="mb-10 text-center sm:text-left">
                <h2 className="text-4xl font-display font-black text-slate-800 mb-2">სწავლა და აღმოჩენა</h2>
                <p className="text-slate-500 text-lg font-medium">აირჩიეთ ნებისმიერი თემა. შესწავლილი თემები: <strong className="text-indigo-600">{completedTopics.size}/{topics.length}</strong></p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {topics.map((topic, i) => {
                  const isCompleted = completedTopics.has(topic.id);
                  return (
                    <motion.div 
                      key={topic.id}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                      onClick={() => handleTopicClick(topic.id)}
                      className="group bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl border border-slate-200 cursor-pointer transition-all duration-300 transform flex flex-col min-h-[300px] relative overflow-hidden"
                    >
                      {isCompleted && (
                        <div className="absolute top-6 right-6 text-emerald-500 bg-emerald-50 rounded-full p-2">
                          <CheckCircle2 className="w-6 h-6"/>
                        </div>
                      )}
                      
                      <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl bg-slate-50 border border-slate-100 shadow-inner mb-6 group-hover:scale-110 transition-transform duration-500">
                        {topic.emoji}
                      </div>

                      <h3 className="text-3xl font-bold font-display text-slate-800 mb-4 group-hover:text-indigo-600 transition-colors leading-tight">
                        {topic.title}
                      </h3>
                      
                      <div className="mt-auto pt-6 border-t border-slate-100 flex items-center text-indigo-600 text-sm font-bold uppercase tracking-wider">
                        {isCompleted ? "განმეორება" : "დაწყება"} <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-2 transition-transform" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* TOPIC VIEW */}
          {currentView === 'topic' && selectedTopic && (
            <motion.div 
              key="topic"
              initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className="max-w-4xl mx-auto pb-12"
            >
              {topics.filter(t => t.id === selectedTopic).map(topic => (
                <div key={topic.id} className="bg-white rounded-[2/5rem] shadow-xl border border-slate-200 overflow-hidden mb-8">
                  {/* Hero Image Block */}
                  <div className={cn("relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-900 border-b border-white border-opacity-10 min-h-[300px] flex flex-col justify-end p-8 md:p-12")}>
                    <div className="relative z-20 flex flex-col md:flex-row items-center md:items-end gap-8 mt-auto text-center md:text-left">
                       <div className="w-32 h-32 rounded-[2rem] bg-white flex items-center justify-center text-7xl shadow-2xl shrink-0 border-4 border-white border-opacity-20 backdrop-blur-md relative transform -translate-y-4">
                          {topic.emoji}
                       </div>
                       <div className="mb-4">
                          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-full font-bold text-sm shadow-xl tracking-wide uppercase mb-6 sm:mb-4">
                            <BookOpen className="w-4 h-4"/> ტექსტური მასალა
                          </div>
                          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black leading-tight text-white drop-shadow-xl">{topic.title}</h2>
                       </div>
                    </div>
                  </div>
                  
                  {/* Content Sections */}
                  <div className="p-8 sm:p-12 bg-white">
                    {topic.sections.map((section, idx) => renderSection(section, idx))}

                    <div className="mt-16 bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-3xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                       <div>
                         <h4 className="text-indigo-900 font-bold text-xl mb-2">მზად ხართ შესამოწმებლად?</h4>
                         <p className="text-indigo-700">გადადი ამ თემის ლოკალურ ქვიზზე ცოდნის განსამტკიცებლად.</p>
                       </div>
                       <button onClick={() => initQuizView(topic.id)} className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-full hover:bg-indigo-700 hover:shadow-lg transition-all w-full sm:w-auto shadow-md transform hover:-translate-y-1 min-w-[200px]">
                         ამ თემის ქვიზი
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* QUIZ ENGINE */}
          {currentView === 'quiz' && (
            <motion.div 
              key="quiz"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto pb-12"
            >
              {quizStatus === 'idle' && (
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-10 sm:p-16 text-center">
                  <div className="text-8xl mb-8">🧠</div>
                  <h2 className="text-4xl sm:text-5xl font-display font-black text-slate-800 mb-6">
                    {currentQuizTopic ? "თემის შემოწმება" : "გლობალური ქვიზი"}
                  </h2>
                  <div className="bg-slate-50 inline-block px-8 py-4 rounded-2xl border border-slate-200 mb-10 text-left">
                     <p className="font-bold text-slate-700 mb-2 flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-500"/> დრო: 15 წამი თითო კითხვაზე</p>
                     <p className="font-bold text-slate-700 mb-2 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-indigo-500"/> წესი 1: დროის ამოწურვისას აგებთ</p>
                     <p className="font-bold text-slate-700 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-indigo-500"/> წესი 2: გამსვლელი ქულა 70%</p>
                  </div>
                  <br/>
                  <button onClick={startQuiz} className="px-10 py-5 bg-indigo-600 text-white rounded-full font-bold text-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                    დაწყება
                  </button>
                </div>
              )}

              {quizStatus === 'failed_time' && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl shadow-xl border border-slate-200 p-10 sm:p-16 text-center">
                  <Clock className="w-24 h-24 text-rose-500 mx-auto mb-6" />
                  <h2 className="text-4xl font-display font-black text-slate-800 mb-4 tracking-tight">დრო ამოიწურა!</h2>
                  <p className="text-xl text-slate-600 mb-10 leading-relaxed">სამწუხაროდ თქვენ ვერ ჩაეტიეთ დათმობილ დროში.</p>
                  <button onClick={() => setCurrentView('learn')} className="px-10 py-5 bg-slate-800 text-white rounded-full font-bold text-lg hover:bg-slate-900 transition-all shadow-lg">
                    მიუბრუნდი კონსპექტებს
                  </button>
                </motion.div>
              )}

              {quizStatus === 'failed_score' && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl shadow-xl border border-slate-200 p-10 sm:p-16 text-center">
                  <XCircle className="w-24 h-24 text-rose-500 mx-auto mb-6" />
                  <h2 className="text-4xl font-display font-black text-slate-800 mb-4 tracking-tight">შედეგი არასაკმარისია</h2>
                  <p className="text-xl text-slate-600 mb-10 leading-relaxed">
                    თქვენ ვერ გადალახეთ 70%-იანი ბარიერი. დააგროვეთ {score} ქულა შეძლებელი {activeQuestions.length}-დან.
                  </p>
                  <button onClick={() => setCurrentView('learn')} className="px-10 py-5 bg-slate-800 text-white rounded-full font-bold text-lg hover:bg-slate-900 transition-all shadow-lg">
                    მიუბრუნდი კონსპექტებს
                  </button>
                </motion.div>
              )}

              {quizStatus === 'passed' && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl shadow-xl border border-slate-200 p-10 sm:p-16 text-center">
                  <div className="text-8xl mb-6">🏆</div>
                  <h2 className="text-4xl md:text-5xl font-display font-black text-slate-800 mb-6 tracking-tight">გილოცავთ!</h2>
                  <div className="inline-block px-6 py-2 bg-emerald-100 text-emerald-800 rounded-full font-bold mb-8 uppercase tracking-wider text-sm border border-emerald-200">
                    ნამდვილი ექსპერტი
                  </div>
                  <p className="text-xl text-slate-600 mb-10">დააგროვეთ {score} სწორი პასუხი {activeQuestions.length}-დან. ბრწყინვალე შედეგია!</p>
                  <button onClick={() => setCurrentView('learn')} className="px-10 py-5 bg-indigo-600 text-white rounded-full font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg">
                    სწავლის გაგრძელება
                  </button>
                </motion.div>
              )}

              {quizStatus === 'playing' && (
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                  <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-bold text-slate-500 text-sm uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-5 h-5"/> კითხვა {currentQuestionIndex + 1} / {activeQuestions.length}
                      </span>
                      <div className={cn("flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm shadow-sm border transition-colors", 
                        timeLeft <= 5 ? "bg-rose-100 text-rose-700 border-rose-300 animate-pulse scale-105" : "bg-white text-slate-700 border-slate-200"
                      )}>
                        <Clock className="w-4 h-4"/> 00:{timeLeft.toString().padStart(2, '0')}
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner relative">
                      <div className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                           style={{ width: `${((currentQuestionIndex) / activeQuestions.length) * 100}%` }} />
                    </div>
                  </div>
                  
                  <div className="p-6 md:p-10">
                    <AnimatePresence mode="wait">
                      <motion.div key={currentQuestionIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                        <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-800 mb-8 leading-snug">
                          {activeQuestions[currentQuestionIndex].question}
                        </h3>
                        
                        <div className="space-y-4">
                          {activeQuestions[currentQuestionIndex].options.map((option, idx) => {
                            const isSelected = answers[currentQuestionIndex] === idx;
                            const isCorrect = idx === activeQuestions[currentQuestionIndex].answerIndex;
                            const showCorrect = hasAnsweredCurrent && isCorrect;
                            const showIncorrect = hasAnsweredCurrent && isSelected && !isCorrect;

                            return (
                              <button
                                key={idx}
                                onClick={() => answerQuestion(idx)}
                                disabled={hasAnsweredCurrent}
                                className={cn(
                                  "w-full p-5 flex items-center justify-between text-left rounded-2xl font-bold text-lg border-2 transition-all duration-300 outline-none",
                                  !hasAnsweredCurrent ? "bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md hover:bg-slate-50 text-slate-700" :
                                  showCorrect ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-md transform scale-[1.01]" :
                                  showIncorrect ? "bg-rose-50 border-rose-500 text-rose-800 shadow-sm" :
                                  "bg-slate-50 border-slate-100 text-slate-400 opacity-50"
                                )}
                              >
                                <span className="leading-relaxed pr-4">{option}</span>
                                {showCorrect && <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />}
                                {showIncorrect && <XCircle className="w-8 h-8 text-rose-500 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Next Button Container */}
                    <div className="mt-8 flex justify-end">
                       {hasAnsweredCurrent && (
                         <motion.button 
                           initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                           onClick={handleNextClick}
                           className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-slate-300 flex items-center gap-2 transform hover:-translate-y-1 transition-all"
                         >
                           {currentQuestionIndex === activeQuestions.length - 1 ? "დასრულება" : "შემდეგი კითხვა"} <ChevronRight className="w-5 h-5"/>
                         </motion.button>
                       )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
