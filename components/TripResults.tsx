import React, { useState, useEffect, useRef } from 'react';
import { Trip, Activity, DaySchedule } from '../types';
import TripMap from './Map';
import { Download, Share2, MapPin, Clock, Wallet, Info, Check, Printer, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

// Declare html2pdf for TypeScript since we are loading it via CDN
declare var html2pdf: any;

interface TripResultsProps {
  trip: Trip;
  onReset: () => void;
}

// Sub-component for individual activity cards
const ActivityCard: React.FC<{ 
    activity: Activity; 
    isActive: boolean; 
    onClick: () => void; 
}> = ({ activity, isActive, onClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Expand description if active
    useEffect(() => {
        if (isActive) setIsExpanded(true);
    }, [isActive]);

    return (
        <div 
            id={`activity-${activity.id}`}
            onClick={onClick}
            className={`
                group relative p-5 border border-arch-line transition-all duration-300 cursor-pointer break-inside-avoid
                ${isActive ? 'bg-neutral-50 border-black ring-1 ring-black shadow-lg translate-x-1' : 'hover:border-neutral-400 hover:bg-neutral-50'}
                print:border print:shadow-none print:translate-x-0 print:p-4 print:mb-4
            `}
        >
            {/* Timeline dot (Hide in print/pdf) */}
            <div 
                data-html2canvas-ignore="true"
                className={`absolute -left-[45px] md:-left-[53px] top-6 w-3 h-3 border border-black transition-colors print:hidden ${isActive ? 'bg-black' : 'bg-white'}`}
            ></div>

            <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xs text-neutral-500">{activity.time}</span>
                <span className="text-[10px] uppercase tracking-widest border border-neutral-200 px-2 py-0.5">{activity.type}</span>
            </div>
            
            <h3 className="text-xl font-medium font-display mb-2 group-hover:text-black leading-tight">{activity.title}</h3>
            
            <div className="relative">
                <p className={`text-sm text-neutral-600 leading-relaxed mb-3 ${!isExpanded ? 'line-clamp-2' : ''}`}>
                    {activity.description}
                </p>
                {activity.description.length > 120 && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        className="text-[10px] uppercase tracking-widest text-neutral-400 hover:text-black mb-3 underline decoration-1 underline-offset-2 flex items-center gap-1"
                    >
                        {isExpanded ? 'Show Less' : 'Read More'}
                    </button>
                )}
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400 font-mono">
                <div className="flex items-center gap-1">
                    <MapPin size={12} /> {activity.locationName}
                </div>
                <div className="flex items-center gap-1">
                     <Clock size={12} /> {activity.duration}
                </div>
                <div className="flex items-center gap-1">
                     <Wallet size={12} /> {activity.costEstimate}
                </div>
            </div>
        </div>
    );
};

// Sub-component for Day Sections (Collapsible)
const DaySection: React.FC<{
    day: DaySchedule;
    activeActivityId: string | null;
    setActiveActivityId: (id: string) => void;
}> = ({ day, activeActivityId, setActiveActivityId }) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasActiveItem = day.activities.some(a => a.id === activeActivityId);

    // Auto-open if an item inside is activated via map
    useEffect(() => {
        if (hasActiveItem) setIsOpen(true);
    }, [hasActiveItem]);

    return (
        <div className="relative break-inside-avoid">
            {/* Sticky Header with Collapse Toggle */}
            <div 
                className="sticky top-0 bg-white/95 backdrop-blur-sm py-4 border-b border-black mb-6 z-10 flex justify-between items-center cursor-pointer hover:bg-neutral-50 transition-colors print:static print:border-b-2"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-baseline gap-4">
                    <h2 className="text-2xl md:text-3xl font-display font-medium">Day 0{day.dayNumber}</h2>
                    <span className="hidden md:inline text-xs text-neutral-500 uppercase tracking-widest">{day.theme}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="md:hidden text-[10px] text-neutral-500 uppercase tracking-widest text-right truncate max-w-[120px]">{day.theme}</span>
                    <button className="p-1">
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>
            </div>

            {/* Activities List */}
            {isOpen && (
                <div className="space-y-6 border-l border-arch-line ml-3 md:ml-4 pl-8 md:pl-10 relative print:ml-0 print:pl-4 print:border-l-2 pb-12 animate-in slide-in-from-top-2 duration-300">
                    {day.activities.map((activity) => (
                        <ActivityCard 
                            key={activity.id}
                            activity={activity}
                            isActive={activeActivityId === activity.id}
                            onClick={() => setActiveActivityId(activity.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const TripResults: React.FC<TripResultsProps> = ({ trip, onReset }) => {
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showMobileMap, setShowMobileMap] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itineraryContainerRef = useRef<HTMLDivElement>(null);

  // Handle scrolling to element when map marker is clicked (only when mobile map is closed)
  useEffect(() => {
    if (activeActivityId && scrollContainerRef.current && !showMobileMap) {
      const element = document.getElementById(`activity-${activeActivityId}`);
      if (element) {
        // Use scrollIntoView with behavior smooth and block center
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeActivityId, showMobileMap]);

  const handleExportPDF = () => {
    if (!itineraryContainerRef.current) return;
    
    setIsExporting(true);

    const element = itineraryContainerRef.current;
    
    // PDF Generation Options
    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     `${trip.destination.replace(/\s+/g, '_')}_Itinerary.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(element).save().then(() => {
            setIsExporting(false);
        }).catch((err: any) => {
            console.error('PDF Export failed:', err);
            setIsExporting(false);
            alert('Could not generate PDF. Please try using the browser print option.');
        });
    } else {
        window.print();
        setIsExporting(false);
    }
  };

  const handleShare = async () => {
    const text = `TRIP ITINERARY: ${trip.destination.toUpperCase()}\n\n` +
      `${trip.summary}\n\n` +
      `Duration: ${trip.durationDays} Days\n` +
      `Budget: ${trip.budget.total}\n\n` +
      `Generated by Arch.Itinerary`;

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col lg:flex-row h-[100dvh] bg-white print:relative print:h-auto print:block">
      
      {/* Print Styles */}
      <style>{`
        @media print {
          @page { margin: 2cm; }
          body { -webkit-print-color-adjust: exact; }
          ::-webkit-scrollbar { display: none; }
        }
      `}</style>

      {/* LEFT PANEL: Itinerary Content */}
      <div 
        ref={itineraryContainerRef}
        className="w-full lg:w-[45%] h-full flex flex-col border-r border-arch-line relative z-10 bg-white shadow-xl lg:shadow-none print:w-full print:border-none print:shadow-none"
      >
        
        {/* Header - Fixed at top of panel, compact padding */}
        <header className="px-6 md:px-10 py-6 border-b border-arch-line bg-white shrink-0 z-20 print:border-none">
            {/* Actions Bar */}
            <div className="flex justify-between items-center mb-6 print:hidden" data-html2canvas-ignore="true">
                <button onClick={onReset} className="text-xs uppercase tracking-widest hover:underline text-neutral-500 hover:text-black transition-colors flex items-center gap-2">
                    ← Plan New Trip
                </button>
                <div className="flex gap-6">
                    <button 
                        onClick={handleExportPDF} 
                        disabled={isExporting}
                        className="text-xs uppercase tracking-widest hover:underline flex items-center gap-2 text-neutral-500 hover:text-black transition-colors disabled:opacity-50"
                    >
                        {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />} 
                        {isExporting ? 'Generating...' : 'Export PDF'}
                    </button>
                    <button 
                        onClick={handleShare} 
                        className="text-xs uppercase tracking-widest hover:underline flex items-center gap-2 text-neutral-500 hover:text-black transition-colors"
                    >
                        {isCopied ? <Check size={14} /> : <Share2 size={14} />} 
                        {isCopied ? 'Copied' : 'Share Link'}
                    </button>
                </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-medium leading-tight mb-3 text-black">
                {trip.destination}
            </h1>
            <p className="text-neutral-500 font-sans text-sm md:text-base leading-relaxed max-w-lg print:text-black line-clamp-3 md:line-clamp-none">
                {trip.summary}
            </p>
            
            <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium tracking-wide print:text-xs print:mt-4 text-neutral-800">
                <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-none">
                    <Clock size={14} /> {trip.durationDays} Days
                </div>
                <div className="flex items-center gap-2 bg-neutral-100 px-3 py-1.5 rounded-none">
                    <Wallet size={14} /> {trip.budget.total} ({trip.budget.currency})
                </div>
            </div>
        </header>

        {/* Scrollable List - Fills remaining space - Auto overflow */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-white min-h-0 print:overflow-visible print:h-auto scroll-smooth">
            <div className="px-6 md:px-10 py-8 print:py-4 print:space-y-8">
                {trip.schedule.map((day) => (
                    <DaySection 
                        key={day.dayNumber}
                        day={day}
                        activeActivityId={activeActivityId}
                        setActiveActivityId={setActiveActivityId}
                    />
                ))}
                
                {/* Budget Footer Section */}
                <div className="mt-8 p-6 md:p-8 bg-neutral-50 border border-arch-line break-inside-avoid print:bg-transparent print:border-black">
                    <h3 className="font-display text-lg uppercase tracking-widest mb-6 border-b border-black/10 pb-4">Budget Breakdown</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-12 text-sm">
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Accommodation</span>
                            <span className="font-medium">{trip.budget.accommodation}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Food & Dining</span>
                            <span className="font-medium">{trip.budget.food}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500">Activities</span>
                            <span className="font-medium">{trip.budget.activities}</span>
                        </div>
                        <div className="flex justify-between pt-4 border-t border-black/10 font-bold text-base col-span-2">
                            <span>Total Estimate</span>
                            <span>{trip.budget.total}</span>
                        </div>
                    </div>
                </div>
                
                {/* End Spacer */}
                <div className="h-24 print:hidden"></div>
            </div>
        </div>
      </div>

      {/* RIGHT PANEL: Map (Hidden in Print, Visible on Desktop) */}
      <div className="hidden lg:block lg:w-[55%] h-full bg-[#f4f4f4] relative z-0 print:hidden" data-html2canvas-ignore="true">
         <TripMap 
            trip={trip} 
            activeActivityId={activeActivityId}
            onMarkerClick={setActiveActivityId} 
         />
      </div>

      {/* Mobile Map Toggle Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50 print:hidden" data-html2canvas-ignore="true">
        <button 
             onClick={() => setShowMobileMap(true)}
             className="bg-black text-white p-4 shadow-xl border border-white hover:bg-neutral-800 transition-colors"
             aria-label="Open Map"
        >
            <MapPin />
        </button>
      </div>

      {/* Mobile Map Fullscreen Overlay */}
      {showMobileMap && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300" data-html2canvas-ignore="true">
          {/* Map Header */}
          <div className="flex justify-between items-center p-4 border-b border-arch-line bg-white">
            <h2 className="font-display text-lg font-medium">Map View</h2>
            <button 
              onClick={() => setShowMobileMap(false)}
              className="p-2 hover:bg-neutral-100 transition-colors"
              aria-label="Close Map"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          {/* Map Container */}
          <div className="flex-1 relative">
            <TripMap 
              trip={trip} 
              activeActivityId={activeActivityId}
              onMarkerClick={() => {}} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TripResults;