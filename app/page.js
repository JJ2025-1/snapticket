'use client';
import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { getMovies, bookTickets, getUserBookings, refundTicket } from './actions';

export default function Page() {
  const [activeTab, setActiveTab] = useState('Showtimes');
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [tempProfile, setTempProfile] = useState({ name: '', phone: '' });
  const [userHistory, setUserHistory] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [seatCount, setSeatCount] = useState(1);
  const [showSeatCountModal, setShowSeatCountModal] = useState(false);

  const transportIcons = {
    1: '🚶', // Single
    2: '🚲', // Bike
    3: '🛺', // Auto
    4: '🚗', // Car
    5: '🚐', // Van
    6: '🚐',
    7: '🚌', // Bus
    8: '🚌',
    9: '🚌',
    10: '🚌'
  };

  const handleShowtimeClick = (movie) => {
    setSelectedMovie(movie);
    setShowSeatCountModal(true);
  };

  // For Quick Book
  const [qbMovie, setQbMovie] = useState('');

  useEffect(() => {
    loadMovies();
    generateDates();
    const savedProfile = localStorage.getItem('snapTicket_profile');
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setUserProfile(parsed);
    }
  }, []);

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      dates.push({
        display: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        value: d.toLocaleDateString('en-GB') // DD/MM/YYYY
      });
    }
    setAvailableDates(dates);
    setSelectedDate(dates[0].value);
  };

  useEffect(() => {
    if (activeTab === 'Profile' && userProfile) {
      fetchUserHistory(userProfile.phone);
    }
  }, [activeTab]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab, receipt]);

  const fetchUserHistory = async (phone) => {
    if (!phone) return;
    const trimmed = phone.trim();
    setLoading(true);
    // Small delay to ensure DB/File sync is complete
    await new Promise(r => setTimeout(r, 500));
    const history = await getUserBookings(trimmed);
    setUserHistory(history || []);
    setLoading(false);
  };

  const handleRefund = async (bookingId) => {
    if (!confirm("Are you sure you want to refund this ticket?")) return;
    try {
      setLoading(true);
      await refundTicket(bookingId, userProfile.phone);
      alert("Ticket refunded successfully!");
      fetchUserHistory(userProfile.phone);
      loadMovies();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Slideshow Logic - Fast (2 seconds)
  useEffect(() => {
    if (movies.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % movies.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [movies]);

  const saveProfile = () => {
    if (!tempProfile.name?.trim() || !tempProfile.phone?.trim()) {
      setError('Name and Phone are required');
      return;
    }
    const cleanProfile = {
      name: tempProfile.name.trim(),
      phone: tempProfile.phone.trim()
    };
    localStorage.setItem('snapTicket_profile', JSON.stringify(cleanProfile));
    setUserProfile(cleanProfile);
    setShowProfileModal(false);
    setError('');
  };

  const loadMovies = async () => {
    try {
      const data = await getMovies();
      setMovies(data || []);
    } catch (err) {
      console.error("Failed to load movies:", err);
      setError("Failed to connect to movie database.");
    }
  };

  const handleBooking = async () => {
    if (!userProfile) {
      setShowProfileModal(true);
      return;
    }
    try {
      setError('');
      setLoading(true);
      const totalAmount = calculateTotal();
      const res = await bookTickets(selectedMovie.id, userProfile.name, userProfile.phone, selectedSeats, totalAmount, selectedDate);
      setReceipt(res);
      setActiveTab('receipt');
      fetchUserHistory(userProfile.phone);
      setSelectedMovie(null);
      setSelectedSeats([]);
      await loadMovies();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentHeroMovie = movies[currentSlide] || null;

  const getSeatPrice = (seatId) => {
    if (!selectedMovie) return 0;
    const base = parseFloat(selectedMovie.price);
    const row = seatId.charAt(0);
    if (row === 'A') return 120;
    if (row === 'E') return base + 150;
    return base;
  };

  const calculateTotal = () => {
    return selectedSeats.reduce((sum, seat) => sum + getSeatPrice(seat), 0);
  };

  const handleSeatClick = (seatId) => {
    if (!selectedMovie || (selectedMovie.booked_seats && selectedMovie.booked_seats.includes(seatId))) return;
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
      setError('');
    } else {
      if (selectedSeats.length < seatCount) {
        setSelectedSeats([...selectedSeats, seatId]);
        setError('');
      } else {
        setError(`Limit reached! You chose to book ${seatCount} seat(s).`);
      }
    }
  };

  return (
    <main className={styles.main}>
      {/* GLOBAL ERROR DISPLAY */}
      {error && (
        <div style={{
          background: '#fee2e2', color: '#b91c1c', padding: '15px', textAlign: 'center', 
          fontSize: '14px', fontWeight: '600', position: 'sticky', top: '70px', zIndex: 1001,
          borderBottom: '1px solid #fecaca'
        }}>
          ⚠️ {error} <button onClick={() => setError('')} style={{background: 'none', border: 'none', marginLeft: '10px', cursor: 'pointer', fontWeight: '800'}}>✕</button>
        </div>
      )}

      {/* SnapTickets HEADER */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo} onClick={() => { setActiveTab('Showtimes'); setSelectedMovie(null); setReceipt(null); }} style={{cursor: 'pointer'}}>
            SnapTickets
          </div>
          
          <nav className={styles.nav}>
            <div className={`${styles.navItem} ${activeTab === 'Showtimes' || activeTab === 'Movies' ? styles.navItemActive : ''}`} onClick={() => { setActiveTab('Showtimes'); setSelectedMovie(null); setReceipt(null); }}>
              <span className={styles.navIcon}>🏠</span> Home
            </div>
          </nav>

          <div className={styles.headerRight}>
            {userProfile ? (
              <div 
                className={`${styles.profileBadge} ${activeTab === 'Profile' ? styles.profileBadgeActive : ''}`}
                onClick={() => {
                  setActiveTab('Profile');
                  setSelectedMovie(null);
                  setReceipt(null);
                  fetchUserHistory(userProfile.phone);
                }}
                style={{cursor: 'pointer'}}
              >
                👤 {userProfile.name}
              </div>
            ) : (
              <button className={styles.loginBtn} onClick={() => setShowProfileModal(true)}>
                👤 Create Profile
              </button>
            )}
          </div>
        </div>
      </header>

      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Create Your Profile</h3>
            <p>Please provide your details to continue booking.</p>
            {error && <p style={{color: 'red', fontSize: '12px'}}>{error}</p>}
            <input 
              type="text" 
              placeholder="Full Name" 
              className={styles.modalInput}
              value={tempProfile.name}
              onChange={e => setTempProfile({...tempProfile, name: e.target.value})}
            />
            <input 
              type="tel" 
              placeholder="Phone Number" 
              className={styles.modalInput}
              value={tempProfile.phone}
              onChange={e => setTempProfile({...tempProfile, phone: e.target.value})}
            />
            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button className="btn-snaptickets" style={{flex: 1}} onClick={saveProfile}>Save Profile</button>
              <button className="btn-snaptickets" style={{flex: 1, background: '#2a2a2a', color: '#fff'}} onClick={() => setShowProfileModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT VIEW - MUTUALLY EXCLUSIVE */}
      {activeTab === 'receipt' && receipt && (
        <div className={styles.contentArea}>
          <div className={`${styles.receipt} animate-fade-in`}>
            <div style={{fontSize: '50px', marginBottom: '10px'}}>✅</div>
            <h2 style={{color: '#28a745', marginBottom: '10px', fontWeight: 800}}>BOOKING CONFIRMED</h2>
            <p style={{color: '#6c757d', marginBottom: '30px'}}>Hi {receipt.customerName}, your tickets are ready!</p>
            
            <div style={{textAlign: 'left', background: '#2a2a2a', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #333'}}>
  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}><strong>Booking ID:</strong> <span>{receipt.bookingId}</span></div>
  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}><strong>Movie:</strong> <span>{receipt.showName}</span></div>
  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}><strong>Seats:</strong> <span>{receipt.seats.join(', ')}</span></div>
  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}><strong>Phone:</strong> <span>{receipt.customerPhone}</span></div>
  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '18px', borderTop: '1px solid #444', paddingTop: '10px', marginTop: '10px'}}><strong>Total Paid:</strong> <strong>₹{receipt.totalAmount.toFixed(2)}</strong></div>
</div>

            <div style={{display: 'flex', gap: '10px'}}>
              <button className="btn-snaptickets" style={{flex: 1}} onClick={() => { setActiveTab('Showtimes'); setReceipt(null); }}>Back to Home</button>
              <button className="btn-snaptickets" style={{flex: 1, background: 'var(--snaptickets-gold)', color: '#000'}} onClick={async () => { 
                setActiveTab('Profile'); 
                setReceipt(null);
                setSelectedMovie(null);
                if (userProfile) await fetchUserHistory(userProfile.phone);
              }}>View My Bookings</button>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE VIEW */}
      {activeTab === 'Profile' && (
        <div className={`${styles.contentArea} animate-fade-in`}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
            <h1 style={{fontSize: '28px', fontWeight: 800}}>My Bookings</h1>
            <button className="btn-snaptickets" onClick={() => setActiveTab('Now Showing')}>
              🏠 Back to Home
            </button>
          </div>

          {loading ? (
            <p style={{textAlign: 'center', padding: '50px'}}>Loading your tickets...</p>
          ) : userHistory.length === 0 ? (
            <div style={{textAlign: 'center', padding: '100px 20px', background: '#1a1a1a', borderRadius: '16px', border: '1px solid #333'}}>
  <div style={{fontSize: '50px', marginBottom: '20px'}}>🎟️</div>
  <h3 style={{color: '#fff'}}>No Bookings Found</h3>
  <p style={{color: 'var(--text-muted)', marginTop: '10px'}}>You haven't booked any movies yet. Start exploring!</p>
  <button className="btn-snaptickets" style={{marginTop: '30px'}} onClick={() => setActiveTab('Now Showing')}>Explore Movies</button>
</div>
          ) : (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px'}}>
              {userHistory.map((ticket) => {
                // Determine if the show is over (Expired)
                // Using DD/MM/YYYY format from the ticket
                const [d, m, y] = (ticket.showDate || '').split('/');
                const showDateTime = ticket.showDate ? new Date(y, m - 1, d, 19, 0, 0) : new Date(0);
                const isExpired = new Date() > showDateTime;

                return (
                  <div key={ticket.bookingId} className={`${styles.ticketCard} ${isExpired ? styles.ticketExpired : ''}`}>
                    <div className={styles.ticketHeader}>
                      <span className={styles.ticketId}>ID: {ticket.bookingId}</span>
                      <span className={styles.ticketDate}>{ticket.showDate || ticket.timestamp?.split(',')[0]}</span>
                    </div>
                    <div className={styles.ticketBody} style={{ textDecoration: isExpired ? 'line-through' : 'none', opacity: isExpired ? 0.5 : 1 }}>
                      <h3 className={styles.ticketMovie}>{ticket.showName || ticket.show_name}</h3>
                      <div className={styles.ticketDetail}>
                        <strong>Seats:</strong> <span>{ticket.seats?.join(', ')}</span>
                      </div>
                      <div className={styles.ticketDetail}>
                        <strong>Amount:</strong> <span>₹{parseFloat(ticket.totalAmount || ticket.total_amount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className={styles.ticketFooter}>
                      {isExpired ? (
                        <span style={{ color: '#6c757d' }}>⌛ Expired</span>
                      ) : (
                        <>
                          <span>✅ Confirmed</span>
                          <button 
                            className="btn-snaptickets" 
                            style={{padding: '5px 15px', fontSize: '10px', background: '#dc3545', color: '#fff'}}
                            onClick={(e) => { e.stopPropagation(); handleRefund(ticket.bookingId); }}
                          >
                            Refund
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SEAT COUNT MODAL */}
      {showSeatCountModal && selectedMovie && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{maxWidth: '500px', textAlign: 'center'}}>
            <h3 style={{marginBottom: '20px'}}>How many seats?</h3>
            <div style={{fontSize: '80px', margin: '30px 0', filter: 'drop-shadow(0 0 10px rgba(255,196,0,0.3))'}}>
              {transportIcons[seatCount]}
            </div>
            
            <div style={{display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '40px'}}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <div 
                  key={n} 
                  onClick={() => setSeatCount(n)}
                  style={{
                    width: '35px', height: '35px', borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontWeight: '700', fontSize: '14px',
                    background: seatCount === n ? 'var(--snaptickets-gold)' : 'transparent',
                    color: seatCount === n ? '#000' : '#fff',
                    border: seatCount === n ? 'none' : '1px solid #444',
                    transition: 'all 0.2s'
                  }}
                >
                  {n}
                </div>
              ))}
            </div>

            <div style={{display: 'flex', justifyContent: 'center', gap: '40px', padding: '20px 0', borderTop: '1px solid #333'}}>
              <div>
                <div style={{fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px'}}>PRIME</div>
                <div style={{fontWeight: '700'}}>₹183.80</div>
                <div style={{fontSize: '10px', color: '#28a745', marginTop: '4px', fontWeight: '800'}}>AVAILABLE</div>
              </div>
              <div>
                <div style={{fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px'}}>CLASSIC</div>
                <div style={{fontWeight: '700'}}>₹54.35</div>
                <div style={{fontSize: '10px', color: '#dc3545', marginTop: '4px', fontWeight: '800'}}>SOLD OUT</div>
              </div>
            </div>

            <button 
              className="btn-snaptickets" 
              style={{width: '100%', marginTop: '30px', padding: '15px', borderRadius: '12px'}}
              onClick={() => setShowSeatCountModal(false)}
            >
              Select Seats
            </button>
          </div>
        </div>
      )}

      {/* SEAT SELECTION AREA */}
      {selectedMovie && !showSeatCountModal && activeTab !== 'receipt' && activeTab !== 'Profile' && (
        <div className={styles.contentArea}>
          <div className={`${styles.seatSection} animate-fade-in`}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px'}}>
              <h2 style={{textTransform: 'uppercase', fontWeight: 400, fontSize: '2rem', color: 'var(--snaptickets-gold)'}}>{selectedMovie.title}</h2>
              <button onClick={() => setSelectedMovie(null)} className="btn-snaptickets" style={{background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)'}}>
                ✕ Close
              </button>
            </div>

            <div className={styles.seatHeaderPrice}>
              <span>₹183.80 PRIME</span>
            </div>

            <div className={styles.seatGridWrapper}>
              {['L','K','J','H','G','F','E','D','C'].map(row => (
                <div key={row} className={styles.seatRow}>
                  <div className={styles.rowLabel}>{row}</div>
                  <div className={styles.rowSeats}>
                    {Array.from({length: 20}, (_, i) => i + 1).map(num => {
                      const id = `${row}${num}`;
                      const isBooked = selectedMovie.booked_seats?.includes(id);
                      const isSelected = selectedSeats.includes(id);
                      const isBestseller = (row === 'J' || row === 'H' || row === 'L') && (num === 7 || num === 8 || num === 9 || num === 10 || num === 12);
                      
                      // Skip some seats to create the gap layout
                      if (num === 12 && (row !== 'L' && row !== 'J' && row !== 'H' && row !== 'G')) return <div key={id} className={styles.seatGap} />;
                      
                      return (
                        <div 
                          key={id} 
                          onClick={() => handleSeatClick(id)}
                          className={`${styles.newSeat} ${isBooked ? styles.seatSold : ''} ${isSelected ? styles.seatSelected : ''} ${isBestseller ? styles.seatBestseller : ''}`}
                        >
                          {num.toString().padStart(2, '0')}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className={styles.seatHeaderPrice} style={{margin: '40px 0 20px'}}>
                <span>₹54.35 CLASSIC</span>
              </div>

              {['B','A'].map(row => (
                <div key={row} className={styles.seatRow}>
                  <div className={styles.rowLabel}>{row}</div>
                  <div className={styles.rowSeats}>
                    {Array.from({length: 18}, (_, i) => i + 1).map(num => {
                      const id = `${row}${num}`;
                      const isBooked = true; // Classic sold out as per image
                      return (
                        <div key={id} className={`${styles.newSeat} ${styles.seatSold}`}>
                          {num.toString().padStart(2, '0')}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.screenWrapper}>
              <div className={styles.newScreen} />
              <div className={styles.screenText}>All eyes this way please</div>
            </div>

            <div className={styles.seatLegendContainer}>
              <div className={styles.legendItem}><div className={`${styles.legendBox} ${styles.seatBestseller}`} /> Bestseller</div>
              <div className={styles.legendItem}><div className={`${styles.legendBox} ${styles.seatAvailable}`} /> Available</div>
              <div className={styles.legendItem}><div className={`${styles.legendBox} ${styles.seatSelectedLegend}`} /> Selected</div>
              <div className={styles.legendItem}><div className={`${styles.legendBox} ${styles.seatSoldLegend}`} /> Sold</div>
            </div>

            {selectedSeats.length > 0 && (
              <div className={styles.bookingFooter}>
                <div style={{fontSize: '18px', fontWeight: '800'}}>Total: ₹{calculateTotal().toFixed(2)}</div>
                <button className="btn-snaptickets" style={{padding: '12px 60px', background: '#f84464'}} onClick={handleBooking} disabled={loading}>
                  {loading ? 'Processing...' : 'Proceed to Pay'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK BOOK BAR */}
      {!selectedMovie && (activeTab === 'Showtimes' || activeTab === 'Movies') && !receipt && (
        <div className={styles.quickBookWrapper}>
          <div className={styles.quickBook}>
            <span className={styles.quickBookLabel}>Quick Book</span>
            
            <select className={styles.quickBookSelect} value={qbMovie} onChange={e => setQbMovie(e.target.value)}>
              <option value="">Select Movie</option>
              {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>

            <select className={styles.quickBookSelect} value={selectedDate} onChange={e => setSelectedDate(e.target.value)}>
              {availableDates.map(d => <option key={d.value} value={d.value}>{d.display}</option>)}
            </select>

            <button className="btn-snaptickets" onClick={() => {
              const movie = movies.find(m => m.id == qbMovie);
              if (movie) setSelectedMovie(movie);
            }}>Book</button>
          </div>
        </div>
      )}

      {/* HOME TAB VIEW */}
      {!selectedMovie && (activeTab === 'Showtimes' || activeTab === 'Movies') && !receipt && (
        <>
          {/* HERO SLIDESHOW */}
          {currentHeroMovie && (
            <section className={styles.hero}>
              <div className={styles.heroContent}>
                <h1>{currentHeroMovie.title}</h1>
                <p>U • 2h 24m • Drama • Tamil • Relive the magic of this cinematic masterpiece with prime seating and exclusive offers only at SnapTickets.</p>
                <div>
                  <button className="btn-snaptickets" onClick={() => {
                    setSelectedMovie(currentHeroMovie);
                    // Default to today if booking from hero
                    if (!selectedDate && availableDates.length > 0) setSelectedDate(availableDates[0].value);
                  }}>Book Now</button>
                </div>
              </div>
              <div className={styles.heroPoster}>
                <img src={currentHeroMovie.poster_url} alt={currentHeroMovie.title} />
              </div>
            </section>
          )}

          {/* MOVIE TABS & GRID */}
          <div className={styles.contentArea}>
            <div className={styles.tabHeader}>
              <div className={styles.tabs}>
                <div className={`${styles.tab} ${activeTab === 'Showtimes' ? styles.tabActive : ''}`} onClick={() => setActiveTab('Showtimes')}>Showtimes</div>
                <div className={`${styles.tab} ${activeTab === 'Movies' ? styles.tabActive : ''}`} onClick={() => setActiveTab('Movies')}>Movies</div>
                <div className={styles.tab}>Coming Soon</div>
              </div>

              <div className={styles.tabFilters}>
                <select className={styles.filterSelect}><option>All Genres</option></select>
              </div>
            </div>

            {activeTab === 'Showtimes' ? (
              <div className={styles.scheduleView}>
                <div className={styles.dateTabs}>
                  {availableDates.map(d => (
                    <div 
                      key={d.value} 
                      className={`${styles.dateTab} ${selectedDate === d.value ? styles.dateTabActive : ''}`}
                      onClick={() => setSelectedDate(d.value)}
                    >
                      <span className={styles.dateTabMonth}>{d.display.split(' ')[1].toUpperCase()}</span>
                      <span className={styles.dateTabDay}>{d.display.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.scheduleList}>
                  {movies.map(movie => (
                    <div key={movie.id} className={styles.scheduleItem}>
                      <div className={styles.scheduleMovieInfo}>
                        <h3 className={styles.scheduleMovieTitle}>{movie.title}</h3>
                        <p className={styles.scheduleMovieMeta}>Tamil, 2D • UA</p>
                      </div>
                      <div className={styles.showtimes}>
                        {['10:30 AM', '01:45 PM', '04:30 PM', '07:15 PM', '10:30 PM'].map(time => (
                          <button 
                            key={time} 
                            className={styles.showtimeBtn}
                            onClick={() => handleShowtimeClick(movie)}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.grid}>
                {movies.map(movie => (
                  <div key={movie.id} className={styles.card} onClick={() => setSelectedMovie(movie)}>
                    <div className={styles.posterWrapper}>
                      <img src={movie.poster_url} alt={movie.title} className={styles.posterImg} />
                      <div className={styles.posterOverlay}>
                        <button className="btn-snaptickets">Book Now</button>
                      </div>
                    </div>
                    <div className={styles.cardTitle}>{movie.title}</div>
                    <div className={styles.cardMeta}>
                      <span className={styles.metaBadge}>UA</span>
                      <span>Tamil</span>
                      <span>•</span>
                      <span>₹{movie.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
