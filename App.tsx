import React, { useState, useEffect } from 'react';
import { generateTripItinerary } from './services/aiService';
import { saveTripToHistory, getTripHistory, HistoryItem, clearHistory } from './services/storageService';
import { Trip } from './types';
import { Button, Input, Section } from './components/ui/Layout';
import TripResults from './components/TripResults';
import { ArrowRight, Compass, Loader2, X, History, Trash2, Calendar, MapPin, ArrowDown } from 'lucide-react';

const App: React.FC = () => {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState<number>(3);
  const [apiKey, setApiKey] = useState('');
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setHistory(getTripHistory());

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGenerate = async () => {
    if (!destination) return;
    
    setLoading(true);
    setError(null);

    try {
      const data = await generateTripItinerary(destination, days, apiKey);
      setTrip(data);
      const updatedHistory = saveTripToHistory(data);
      setHistory(updatedHistory);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to design your trip at this moment. Please check your API configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadHistoryItem = (item: HistoryItem) => {
    setTrip(item);
    setShowHistory(false);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your travel archives?')) {
        clearHistory();
        setHistory([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && destination) {
        handleGenerate();
    }
  }

  // Render Results View
  if (trip) {
    return <TripResults trip={trip} onReset={() => setTrip(null)} />;
  }

  // Render Landing / Loading View
  return (
    <div className="min-h-screen bg-white flex flex-col relative font-sans text-arch-black scroll-smooth">
      
      {/* Navigation / Brand */}
      <nav 
        className={`
          fixed top-0 w-full flex justify-between items-center z-50 transition-all duration-500 ease-in-out
          ${isScrolled 
            ? 'bg-white/10 backdrop-blur-md shadow-sm pointer-events-auto border-b border-black/5 p-4 md:p-6' 
            : 'bg-transparent backdrop-blur-none pointer-events-none border-b border-transparent p-6 md:p-12'}
        `}
      >
        <div className="pointer-events-auto">
             <span className="font-display font-bold text-xl tracking-tighter border-2 border-black p-2 bg-transparent">ARCH.ITINERARY</span>
        </div>
        <div className="pointer-events-auto hidden md:flex gap-8 text-sm uppercase tracking-widest font-medium px-4 py-2">
            <button onClick={() => setShowHistory(true)} className="hover:underline decoration-1 underline-offset-4">Archives</button>
            <a href="#about" className="hover:underline decoration-1 underline-offset-4">About</a>
        </div>
        {/* Mobile Nav Toggle Replacement (Simple text links for mobile) */}
        <div className="pointer-events-auto flex md:hidden gap-4 text-xs uppercase tracking-widest font-medium px-2 py-1">
            <button onClick={() => setShowHistory(true)}>Archives</button>
        </div>
      </nav>

      {/* History Overlay */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="absolute inset-0" onClick={() => setShowHistory(false)}></div>
           
           <div className="bg-white w-full max-w-5xl border border-black shadow-2xl relative z-10 h-[85vh] flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center p-8 border-b border-black">
                <h2 className="text-4xl md:text-5xl font-display font-medium">Archives</h2>
                <div className="flex gap-4">
                    {history.length > 0 && (
                        <button 
                            onClick={handleClearHistory}
                            className="text-xs uppercase tracking-widest hover:text-red-600 flex items-center gap-2"
                        >
                            <Trash2 size={14} /> Clear All
                        </button>
                    )}
                    <button 
                        onClick={() => setShowHistory(false)} 
                        className="w-12 h-12 flex items-center justify-center border border-black hover:bg-black hover:text-white transition-colors"
                    >
                        <X strokeWidth={1} size={24} />
                    </button>
                </div>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-y-auto p-8 bg-neutral-50">
                {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-400">
                        <History size={48} strokeWidth={1} className="mb-4" />
                        <p className="font-display text-xl">No archival records found.</p>
                        <p className="text-sm mt-2">Generate a trip to save it to your history.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {history.map((item) => (
                            <div 
                                key={item.historyId}
                                onClick={() => handleLoadHistoryItem(item)}
                                className="group bg-white border border-neutral-200 p-6 cursor-pointer transition-all duration-300 hover:border-black hover:shadow-xl hover:-translate-y-1"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className="font-mono text-xs text-neutral-400">
                                        {new Date(item.timestamp).toLocaleDateString()}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-widest border border-neutral-100 px-2 py-1 group-hover:border-black transition-colors">
                                        {item.durationDays} Days
                                    </span>
                                </div>
                                
                                <h3 className="text-2xl font-display font-medium mb-2 group-hover:underline decoration-1 underline-offset-4">
                                    {item.destination}
                                </h3>
                                
                                <p className="text-sm text-neutral-500 line-clamp-3 mb-6 leading-relaxed">
                                    {item.summary}
                                </p>

                                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 group-hover:text-black">
                                    <MapPin size={12} />
                                    <span>Load Itinerary</span>
                                    <ArrowRight size={12} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
              </div>
           </div>
        </div>
      )}

      <main className="flex-grow flex flex-col items-center pt-24 pb-24">
        
        {/* HERO SECTION */}
        <Section className="flex flex-col lg:flex-row gap-16 max-w-7xl min-h-[70vh] justify-center items-center">
          
          {/* Left Side - Text Content */}
          <div className="flex-1 space-y-6">
            <h1 className="text-6xl md:text-8xl font-display font-light leading-[0.9] -ml-1">
              Design your <br />
              <span className="font-medium italic">next journey.</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-500 max-w-xl leading-relaxed">
              Curated, intelligent itineraries for the modern traveler. 
              Enter a destination, and let our system architect your experience.
            </p>
          </div>

          {/* Right Side - Hero Image */}
          <div className="flex-1 w-full lg:w-auto">
            <div className="relative aspect-[4/3] lg:aspect-square overflow-hidden border border-neutral-200 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop"
                alt="Architectural travel destination"
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 ease-in-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-50"></div>
            </div>
          </div>
        </Section>

        {/* FORM SECTION */}
        <Section className="max-w-5xl">
          {/* Form Area */}
          <div className="space-y-12 w-full">
             
             {/* Destination Input */}
             <div className="relative group">
                <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2 group-focus-within:text-black transition-colors">
                  Where to?
                </label>
                <Input 
                  placeholder="Tokyo, Paris, New York..." 
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
             </div>

             {/* Duration Selection */}
             <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-4">
                  Duration
                </label>
                <div className="flex flex-wrap gap-4">
                  {[3, 5, 7].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDays(d)}
                      className={`
                        w-16 h-16 md:w-20 md:h-20 flex items-center justify-center text-xl font-display font-medium border transition-all duration-300
                        ${days === d 
                          ? 'bg-black text-white border-black' 
                          : 'bg-transparent text-neutral-400 border-neutral-200 hover:border-black hover:text-black'}
                      `}
                    >
                      {d}
                    </button>
                  ))}
                  <div className="relative flex items-center justify-center w-24 h-16 md:h-20 border border-neutral-200 focus-within:border-black transition-colors">
                      <input 
                        type="number" 
                        min="1" 
                        max="30"
                        value={days}
                        onChange={(e) => setDays(parseInt(e.target.value) || 3)}
                        className="w-full h-full text-center bg-transparent focus:outline-none font-display text-xl"
                      />
                      <span className="absolute bottom-2 text-[10px] uppercase tracking-widest text-neutral-400 pointer-events-none">Days</span>
                  </div>
                </div>
             </div>

             {/* CTA */}
             <div className="pt-8">
               <Button 
                  onClick={handleGenerate} 
                  disabled={!destination || loading}
                  className="w-full md:w-auto flex items-center justify-between gap-12 group"
                >
                  {loading ? (
                    <>
                      <span>Generating Plan...</span>
                      <Loader2 className="animate-spin" size={20} />
                    </>
                  ) : (
                    <>
                      <span>Generate Itinerary</span>
                      <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                    </>
                  )}
               </Button>
               {error && (
                 <div className="mt-4 space-y-2">
                   <p className="text-red-600 text-sm font-mono">{error}</p>
                   {error.includes("401") && (
                     <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                       <label className="block text-xs uppercase tracking-widest text-neutral-400 mb-2">
                         Enter OpenRouter API Key
                       </label>
                       <Input 
                         placeholder="sk-or-v1-..." 
                         value={apiKey}
                         onChange={(e) => setApiKey(e.target.value)}
                         className="text-sm font-mono"
                       />
                       <p className="text-[10px] text-neutral-400 mt-1">
                         The default API key seems to be invalid. Please provide your own OpenRouter API key.
                       </p>
                     </div>
                   )}
                 </div>
               )}
             </div>
          </div>
          
          <div className="md:hidden flex justify-center mt-12 animate-bounce opacity-50">
             <ArrowDown size={24} />
          </div>
        </Section>

        {/* ABOUT SECTION */}
        <Section id="about" className="border-t border-arch-line mt-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 lg:gap-24">
                {/* Title Column */}
                <div className="md:col-span-5">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-light leading-[1.1] mb-6 md:mb-8 md:sticky md:top-32">
                        About <br /> <span className="font-medium italic">Us.</span>
                    </h2>
                </div>

                {/* Content Column */}
                <div className="md:col-span-7 space-y-8 md:space-y-12 lg:space-y-16">
                    <div className="text-base sm:text-lg md:text-xl font-light text-neutral-600 leading-relaxed space-y-6 md:space-y-8">
                        <p>
                            We believe travel planning should be as elegant as the destination itself. 
                        </p>
                        <p>
                            Most travel tools are cluttered, noisy, and overwhelming. We stripped away the ads, the popups, and the infinite scrolling feeds to create a tool that respects your intelligence and your aesthetic.
                        </p>
                        <p>
                            Powered by GPT-4o, we architect itineraries that balance major landmarks with hidden local textures, creating a spatial narrative for your journey rather than just a checklist.
                        </p>
                    </div>
                </div>
            </div>
        </Section>
      </main>

      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 w-full h-2 bg-gradient-to-r from-black via-neutral-500 to-black opacity-20 pointer-events-none"></div>
    </div>
  );
};

export default App;