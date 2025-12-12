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
    autoExpanded?: boolean;
}> = ({ activity, isActive, onClick, autoExpanded = false }) => {
    const [isExpanded, setIsExpanded] = useState(autoExpanded);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [addressCopied, setAddressCopied] = useState(false);
    const prefersReducedMotion = useRef(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Check for reduced motion preference
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        prefersReducedMotion.current = mediaQuery.matches;
    }, []);

    // Lock body scroll when lightbox is open
    useEffect(() => {
        if (selectedImage) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [selectedImage]);

    const handleCardClick = (e: React.MouseEvent) => {
        // Only trigger map marker click if clicking the card background, not interactive elements
        const target = e.target as HTMLElement;
        if (target.closest('button, a, img, input, textarea')) return;
        // Don't trigger if clicking inside the expanded content section
        if (isExpanded && target.closest('[role="region"]')) return;
        onClick();
    };

    const toggleExpand = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
        // Lazy load images when expanding
        if (!isExpanded && activity.images && !imagesLoaded) {
            setImagesLoaded(true);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpand(e);
        }
    };

    const copyAddress = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (activity.address) {
            try {
                await navigator.clipboard.writeText(activity.address);
                setAddressCopied(true);
                setTimeout(() => setAddressCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy address:', err);
            }
        }
    };

    const shareActivity = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: activity.title,
                    text: activity.description,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        }
    };

    const openDirections = (e: React.MouseEvent) => {
        e.stopPropagation();
        const { lat, lng } = activity.coordinates;
        // Use address if available for better accuracy, otherwise use coordinates
        const destination = activity.address 
            ? encodeURIComponent(activity.address)
            : `${lat},${lng}`;
        window.open(`https://www.google.com/maps/search/?api=1&query=${destination}`, '_blank', 'noopener,noreferrer');
    };

    return (
        <article 
            ref={cardRef}
            id={`activity-${activity.id}`}
            className={`
                group relative border border-arch-line break-inside-avoid bg-white
                ${isActive ? 'border-black ring-1 ring-black shadow-lg' : 'hover:border-neutral-400 hover:shadow-md'}
                ${!isExpanded && 'hover:-translate-y-1'}
                ${prefersReducedMotion.current ? '' : 'transition-all duration-300'}
                print:border print:shadow-none print:translate-y-0 print:p-4 print:mb-4
            `}
        >
            {/* Timeline dot */}
            <div 
                data-html2canvas-ignore="true"
                className={`absolute -left-[45px] md:-left-[53px] top-6 w-3 h-3 border border-black transition-colors print:hidden ${isActive ? 'bg-black' : 'bg-white'}`}
            ></div>

            {/* Compact header - always visible */}
            <div 
                className="p-5 cursor-pointer"
                onClick={handleCardClick}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onKeyDown={handleKeyPress}
                aria-label={`${activity.title}, ${activity.time}`}
            >
                <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs text-neutral-500">{activity.time}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-widest border border-neutral-200 px-2 py-0.5">{activity.type}</span>
                        <button 
                            onClick={toggleExpand}
                            className="p-1 hover:bg-neutral-200 transition-colors print:hidden focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                            aria-label={isExpanded ? "Collapse details" : "Expand details"}
                            type="button"
                        >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>
                </div>
                
                <h3 className="text-xl font-medium font-display mb-2 group-hover:text-black leading-tight">{activity.title}</h3>
                
                <p className="text-sm text-neutral-600 leading-relaxed mb-3 line-clamp-3">
                    {activity.description}
                </p>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400 font-mono">
                    <div className="flex items-center gap-1">
                        <MapPin size={12} /> <span className="truncate max-w-[150px]">{activity.locationName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock size={12} /> {activity.duration}
                    </div>
                    <div className="flex items-center gap-1">
                        <Wallet size={12} /> {activity.costEstimate}
                    </div>
                </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
                <div 
                    className={`border-t border-arch-line bg-white overflow-hidden ${prefersReducedMotion.current ? '' : 'animate-in slide-in-from-top-2 duration-200'}`}
                    onClick={(e) => e.stopPropagation()}
                    role="region"
                    aria-label="Activity details"
                >
                    {/* Close button */}
                    <div className="flex justify-end p-3 print:hidden">
                        <button 
                            onClick={toggleExpand}
                            className="text-neutral-400 hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded-sm"
                            aria-label="Close details"
                            type="button"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <line x1="12" y1="4" x2="4" y2="12"></line>
                                <line x1="4" y1="4" x2="12" y2="12"></line>
                            </svg>
                        </button>
                    </div>

                    <div className="px-5 pb-5 space-y-4 max-h-[600px] overflow-y-auto">
                        {/* Image Gallery */}
                        {activity.images && activity.images.length > 0 && imagesLoaded ? (
                            <div className="space-y-2" role="img" aria-label="Activity photos">
                                <img 
                                    src={activity.images[0]} 
                                    alt={`${activity.title} - main photo`}
                                    loading="lazy"
                                    onClick={() => setSelectedImage(activity.images![0])}
                                    className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity border border-neutral-200"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                                {activity.images.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto pb-2" role="list" aria-label="Additional photos">
                                        {activity.images.slice(1).map((img, idx) => (
                                            <img 
                                                key={idx}
                                                src={img}
                                                alt={`${activity.title} - photo ${idx + 2}`}
                                                loading="lazy"
                                                onClick={() => setSelectedImage(img)}
                                                className="h-16 w-24 object-cover cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0 border border-neutral-200"
                                                role="listitem"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : !activity.images || activity.images.length === 0 ? (
                            <div className="w-full h-48 bg-neutral-100 flex items-center justify-center border border-neutral-200">
                                <div className="text-center text-neutral-400">
                                    <MapPin size={32} className="mx-auto mb-2" />
                                    <p className="text-xs uppercase tracking-widest">No images available</p>
                                </div>
                            </div>
                        ) : null}

                        {/* Full Description */}
                        {activity.fullDescription ? (
                            <div>
                                <h4 className="text-xs uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
                                    <Info size={12} aria-hidden="true" /> Description
                                </h4>
                                <p className="text-sm text-neutral-700 leading-relaxed">{activity.fullDescription}</p>
                            </div>
                        ) : activity.description && (
                            <div>
                                <h4 className="text-xs uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
                                    <Info size={12} aria-hidden="true" /> Description
                                </h4>
                                <p className="text-sm text-neutral-700 leading-relaxed">{activity.description}</p>
                            </div>
                        )}

                        {/* Opening Hours */}
                        {activity.openingHours ? (
                            <div>
                                <h4 className="text-xs uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
                                    <Clock size={12} aria-hidden="true" /> Opening Hours
                                </h4>
                                {activity.openingHours.today && (
                                    <p className="text-sm font-medium mb-2 text-neutral-900">Today: {activity.openingHours.today}</p>
                                )}
                                {activity.openingHours.weekly && activity.openingHours.weekly.length > 0 && (
                                    <div className="text-xs text-neutral-600 space-y-1 bg-neutral-50 p-3 border border-neutral-200">
                                        {activity.openingHours.weekly.map((day, idx) => (
                                            <div key={idx} className="flex justify-between gap-4">
                                                <span className="font-medium min-w-[70px]">{day.day}</span>
                                                <span className="text-right">{day.hours}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <h4 className="text-xs uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
                                    <Clock size={12} aria-hidden="true" /> Opening Hours
                                </h4>
                                <p className="text-sm text-neutral-500 italic">Opening hours not available</p>
                            </div>
                        )}

                        {/* Grid for compact info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            {/* Suggested Duration */}
                            {activity.suggestedDuration && (
                                <div>
                                    <h4 className="text-xs uppercase tracking-widest text-neutral-400 mb-1 flex items-center gap-1">
                                        <Clock size={12} /> Visit Time
                                    </h4>
                                    <p className="text-neutral-700">{activity.suggestedDuration}</p>
                                </div>
                            )}

                            {/* Ticket Price */}
                            {activity.ticketPrice && (
                                <div>
                                    <h4 className="text-xs uppercase tracking-widest text-neutral-400 mb-1 flex items-center gap-1">
                                        <Wallet size={12} /> Price
                                    </h4>
                                    <p className="text-neutral-700">{activity.ticketPrice}</p>
                                </div>
                            )}
                        </div>

                        {/* Best Time to Visit */}
                        {activity.bestTimeToVisit && (
                            <div className="bg-neutral-50 p-3 border-l-2 border-black">
                                <h4 className="text-xs uppercase tracking-widest text-neutral-400 mb-1">Best Time to Visit</h4>
                                <p className="text-sm text-neutral-700">{activity.bestTimeToVisit}</p>
                            </div>
                        )}

                        {/* Location & Directions */}
                        <div>
                            <h4 className="text-xs uppercase tracking-widest text-neutral-400 mb-2 flex items-center gap-1">
                                <MapPin size={12} aria-hidden="true" /> Location
                            </h4>
                            {activity.address ? (
                                <>
                                    <p className="text-sm text-neutral-700 mb-2">{activity.address}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <button 
                                            onClick={copyAddress}
                                            className="text-xs text-neutral-600 hover:text-black underline focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded-sm"
                                            type="button"
                                            aria-label="Copy address to clipboard"
                                        >
                                            {addressCopied ? '✓ Copied!' : 'Copy address'}
                                        </button>
                                        <button 
                                            onClick={openDirections}
                                            className="text-xs text-neutral-600 hover:text-black underline focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded-sm"
                                            type="button"
                                            aria-label="Open directions in Google Maps"
                                        >
                                            Get directions →
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-neutral-700 mb-2">{activity.locationName}</p>
                                    <button 
                                        onClick={openDirections}
                                        className="text-xs text-neutral-600 hover:text-black underline focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded-sm"
                                        type="button"
                                        aria-label="Open directions in Google Maps"
                                    >
                                        Get directions →
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Transport to Next */}
                        {activity.transportToNext && (
                            <div className="bg-blue-50 border border-blue-200 p-3 text-sm text-neutral-700">
                                <div className="flex items-start gap-2">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5" aria-hidden="true">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                    <div>
                                        <span className="text-xs uppercase tracking-widest text-neutral-500 block mb-1">Next Activity</span>
                                        <p>{activity.transportToNext}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {activity.tags && activity.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2" role="list" aria-label="Activity categories">
                                {activity.tags.map((tag, idx) => (
                                    <span 
                                        key={idx}
                                        role="listitem"
                                        className="text-[10px] uppercase tracking-widest border border-neutral-300 bg-neutral-50 px-2 py-1"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Lightbox for images */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Image viewer"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') setSelectedImage(null);
                        if (activity.images && activity.images.length > 1) {
                            const currentIndex = activity.images.indexOf(selectedImage);
                            if (e.key === 'ArrowLeft' && currentIndex > 0) {
                                setSelectedImage(activity.images[currentIndex - 1]);
                            }
                            if (e.key === 'ArrowRight' && currentIndex < activity.images.length - 1) {
                                setSelectedImage(activity.images[currentIndex + 1]);
                            }
                        }
                    }}
                    tabIndex={0}
                >
                    <button 
                        className="absolute top-4 right-4 text-white hover:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-white rounded-sm p-2"
                        onClick={() => setSelectedImage(null)}
                        aria-label="Close lightbox"
                        type="button"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    
                    {/* Navigation buttons for multiple images */}
                    {activity.images && activity.images.length > 1 && (
                        <>
                            <button 
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-white rounded-sm p-2 disabled:opacity-30 disabled:cursor-not-allowed"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const currentIndex = activity.images!.indexOf(selectedImage);
                                    if (currentIndex > 0) setSelectedImage(activity.images![currentIndex - 1]);
                                }}
                                disabled={activity.images.indexOf(selectedImage) === 0}
                                aria-label="Previous image"
                                type="button"
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <button 
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-white rounded-sm p-2 disabled:opacity-30 disabled:cursor-not-allowed"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const currentIndex = activity.images!.indexOf(selectedImage);
                                    if (currentIndex < activity.images!.length - 1) setSelectedImage(activity.images![currentIndex + 1]);
                                }}
                                disabled={activity.images.indexOf(selectedImage) === activity.images.length - 1}
                                aria-label="Next image"
                                type="button"
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                            
                            {/* Image counter */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                                {activity.images.indexOf(selectedImage) + 1} / {activity.images.length}
                            </div>
                        </>
                    )}
                    
                    <img 
                        src={selectedImage}
                        alt={`${activity.title} - Full size`}
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </article>
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
                className="sticky top-0 bg-white/95 backdrop-blur-sm py-2 border-b border-black mb-3 z-10 flex justify-between items-center cursor-pointer hover:bg-neutral-50 transition-colors print:static print:border-b-2"
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
                <div className="space-y-3 border-l border-arch-line ml-3 md:ml-4 pl-8 md:pl-10 relative print:ml-0 print:pl-4 print:border-l-2 pb-6 animate-in slide-in-from-top-2 duration-300">
                    {day.activities.map((activity, index) => (
                        <ActivityCard 
                            key={activity.id}
                            activity={activity}
                            isActive={activeActivityId === activity.id}
                            onClick={() => setActiveActivityId(activity.id)}
                            autoExpanded={false}
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

  const handleExportPDF = async () => {
    if (!itineraryContainerRef.current) return;
    
    setIsExporting(true);

    const element = itineraryContainerRef.current;
    
    // Store original overflow styles
    const scrollContainer = element.querySelector('[class*="overflow-y-auto"]') as HTMLElement;
    const originalOverflow = scrollContainer?.style.overflow || '';
    const originalHeight = scrollContainer?.style.height || '';
    
    // Temporarily make all content visible for PDF capture
    if (scrollContainer) {
      scrollContainer.style.overflow = 'visible';
      scrollContainer.style.height = 'auto';
    }

    // Expand all day sections by clicking their headers if they're collapsed
    const dayHeaders = element.querySelectorAll('[class*="cursor-pointer"]:has(h2)');
    const collapsedDays: HTMLElement[] = [];
    dayHeaders.forEach((header) => {
      const chevronUp = header.querySelector('[class*="lucide-chevron-up"]');
      if (!chevronUp) {
        // Day is collapsed, click to expand
        collapsedDays.push(header as HTMLElement);
        (header as HTMLElement).click();
      }
    });

    // Expand all activity cards by clicking expand buttons
    const expandButtons = element.querySelectorAll('button[aria-label*="Expand details"]');
    const clickedButtons: HTMLElement[] = [];
    expandButtons.forEach((btn) => {
      clickedButtons.push(btn as HTMLElement);
      (btn as HTMLElement).click();
    });

    // Remove line-clamp from descriptions for PDF
    const clampedElements = element.querySelectorAll('[class*="line-clamp"]');
    const originalClasses: Array<{ element: Element; className: string }> = [];
    clampedElements.forEach((el) => {
      originalClasses.push({ element: el, className: el.className });
      el.className = el.className.replace(/line-clamp-\d+/g, '');
    });

    // Wait for all expansions and layout to settle
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // PDF Generation Options
    const opt = {
      margin:       [15, 10, 15, 10],
      filename:     `${trip.destination.replace(/\s+/g, '_')}_Itinerary.pdf`,
      image:        { type: 'jpeg', quality: 0.95 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        scrollY: 0,
        scrollX: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      if (typeof html2pdf !== 'undefined') {
        await html2pdf().set(opt).from(element).save();
      } else {
        window.print();
      }
    } catch (err: any) {
      console.error('PDF Export failed:', err);
      alert('Could not generate PDF. Please try using the browser print option.');
    } finally {
      // Restore original state
      
      // Collapse activity cards that were expanded for PDF
      clickedButtons.forEach(btn => {
        if (btn && btn.getAttribute('aria-label')?.includes('Collapse')) {
          btn.click();
        }
      });

      // Collapse day sections that were expanded for PDF
      collapsedDays.forEach(header => {
        header.click();
      });

      // Restore line-clamp classes
      originalClasses.forEach(({ element, className }) => {
        element.className = className;
      });

      // Restore overflow styles
      if (scrollContainer) {
        scrollContainer.style.overflow = originalOverflow;
        scrollContainer.style.height = originalHeight;
      }

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
                <button 
                    onClick={handleExportPDF} 
                    disabled={isExporting}
                    className="text-xs uppercase tracking-widest hover:underline flex items-center gap-2 text-neutral-500 hover:text-black transition-colors disabled:opacity-50"
                >
                    {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />} 
                    {isExporting ? 'Generating...' : 'Export PDF'}
                </button>
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
            </div>
        </header>

        {/* Scrollable List - Fills remaining space - Auto overflow */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-white min-h-0 print:overflow-visible print:h-auto scroll-smooth">
            <div className="px-6 md:px-10 print:py-4 print:space-y-8">
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