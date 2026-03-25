'use server'
import { supabase } from '@/lib/supabase';
import fs from 'fs/promises';
import path from 'path';

async function getLocalData() {
  try {
    const filePath = path.join(process.cwd(), 'data.json');
    const fileData = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileData);
  } catch (err) {
    console.error("Error reading local data.json:", err);
    return { movies: [], bookings: [] };
  }
}

export async function getMovies() {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('id', { ascending: true });

    let movieData = data;

    if (error) {
      console.error("Supabase Error in getMovies, falling back to local data:", error);
      const local = await getLocalData();
      movieData = local.movies;
    }

    if (!movieData || movieData.length === 0) {
      const local = await getLocalData();
      movieData = local.movies;
    }

    // Dynamically fetch posters from TMDB for each movie title
    const moviesWithPosters = await Promise.all(
      movieData.map(async (movie) => {
        const posterUrl = await getMoviePoster(movie.title);
        return { 
          ...movie, 
          poster_url: posterUrl,
          booked_seats: movie.booked_seats || movie.bookedSeats || [] 
        };
      })
    );

    return moviesWithPosters;
  } catch (err) {
    console.error("Error in getMovies server action:", err);
    const local = await getLocalData();
    return local.movies;
  }
}

async function getMoviePoster(movieTitle) {
  try {
    if (!process.env.TMDB_TOKEN || process.env.TMDB_TOKEN === 'your_tmdb_bearer_token') {
      return "https://via.placeholder.com/500x750?text=No+Poster";
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(movieTitle)}&language=en-US&page=1`,
      {
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${process.env.TMDB_TOKEN}`
        }
      }
    );
    
    const data = await response.json();
    if (data.results && data.results[0]) {
      return `https://image.tmdb.org/t/p/w500${data.results[0].poster_path}`;
    }
  } catch (err) {
    console.error(`Error fetching poster for ${movieTitle}:`, err);
  }
  return "https://via.placeholder.com/500x750?text=No+Poster"; 
}

export async function bookTickets(showId, customerName, customerPhone, seats, totalAmount, showDate) {
  if (!customerName || customerName.trim() === '') throw new Error("Customer name is required");
  if (!customerPhone || customerPhone.trim() === '') throw new Error("Phone number is required");
  if (!seats || seats.length === 0) throw new Error("No seats selected");

  const trimmedPhone = customerPhone.trim();
  const bookingId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const dateStr = showDate || new Date().toLocaleDateString('en-GB');

  // Fetch movie details immediately
  let movieTitle = "Movie";
  try {
    const { data: movie } = await supabase.from('movies').select('title, booked_seats').eq('id', showId).single();
    if (movie) movieTitle = movie.title;
  } catch (err) {
    console.error("Error fetching movie info:", err);
  }

  // Fallback movie title search from local data
  if (movieTitle === "Movie") {
    try {
      const local = await getLocalData();
      const m = local.movies.find(mov => mov.id == showId);
      if (m) movieTitle = m.title;
    } catch (e) {}
  }

  // 1. Try Supabase Update/Insert
  try {
    const { data: movie } = await supabase.from('movies').select('booked_seats').eq('id', showId).single();
    if (movie) {
      const updatedSeats = [...(movie.booked_seats || []), ...seats];
      await supabase.from('movies').update({ booked_seats: updatedSeats }).eq('id', showId);
      
      await supabase.from('bookings').insert([{
        booking_id: bookingId,
        customer_name: customerName,
        customer_phone: trimmedPhone,
        show_name: movieTitle,
        seats: seats,
        total_amount: totalAmount,
        show_date: dateStr
      }]);
    }
  } catch (err) {
    console.error("Supabase booking error:", err);
  }

  // 2. Always persist locally
  try {
    const local = await getLocalData();
    const newBooking = {
      bookingId,
      customerName,
      customerPhone: trimmedPhone,
      showName: movieTitle,
      seats,
      totalAmount,
      showDate: dateStr,
      timestamp: new Date().toLocaleString()
    };

    local.bookings = [newBooking, ...(local.bookings || [])];
    const mIdx = local.movies.findIndex(mov => mov.id == showId);
    if (mIdx !== -1) local.movies[mIdx].booked_seats = [...(local.movies[mIdx].booked_seats || []), ...seats];

    await fs.writeFile(path.join(process.cwd(), 'data.json'), JSON.stringify(local, null, 2));
  } catch (err) {
    console.error("Local save error:", err);
  }

  return {
    bookingId,
    customerName,
    customerPhone: trimmedPhone,
    showName: movieTitle,
    seats,
    totalAmount,
    showDate: dateStr,
    timestamp: new Date().toLocaleString()
  };
}

export async function refundTicket(bookingId, customerPhone) {
  const trimmedPhone = customerPhone?.trim();
  console.log(`Starting refund for ID: ${bookingId}, Phone: ${trimmedPhone}`);
  
  try {
    let booking = null;
    let source = 'sb';

    // 1. Try Supabase first
    try {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('customer_phone', trimmedPhone)
        .single();
      if (data) booking = data;
    } catch (e) {}

    // 2. Try Local Fallback if not found
    if (!booking) {
      const local = await getLocalData();
      const localBooking = (local.bookings || []).find(b => 
        (b.bookingId === bookingId || b.booking_id === bookingId) && 
        (b.customerPhone === trimmedPhone || b.customer_phone === trimmedPhone)
      );
      if (localBooking) {
        booking = localBooking;
        source = 'local';
      }
    }

    if (!booking) {
      throw new Error("Booking not found. Please verify your phone number.");
    }

    // 3. Normalize fields
    const bId = booking.booking_id || booking.bookingId;
    const bMovie = booking.show_name || booking.showName;
    const bSeats = booking.seats || [];
    const bDate = booking.show_date || booking.showDate || new Date().toLocaleDateString('en-GB');

    // 4. Check if refund is allowed (3 hours before 7 PM)
    let day, month, year;
    if (bDate.includes('/')) [day, month, year] = bDate.split('/');
    else if (bDate.includes('-')) [year, month, day] = bDate.split('-');
    else { day = new Date().getDate(); month = new Date().getMonth() + 1; year = new Date().getFullYear(); }

    const showDateTime = new Date(year, month - 1, day, 19, 0, 0); 
    const now = new Date();
    const diffInHours = (showDateTime - now) / (1000 * 60 * 60);
    
    if (diffInHours < 3 && diffInHours > -2) {
      throw new Error("Refunds are only allowed at least 3 hours before the show starts.");
    }

    // 5. Release Seats (Supabase)
    try {
      const { data: movie } = await supabase.from('movies').select('id, booked_seats').eq('title', bMovie).single();
      if (movie) {
        const remaining = (movie.booked_seats || []).filter(s => !bSeats.includes(s));
        await supabase.from('movies').update({ booked_seats: remaining }).eq('id', movie.id);
      }
    } catch (e) {}

    // 6. Release Seats (Local)
    try {
      const local = await getLocalData();
      const mIdx = local.movies.findIndex(m => m.title === bMovie);
      if (mIdx !== -1) {
        local.movies[mIdx].booked_seats = (local.movies[mIdx].booked_seats || []).filter(s => !bSeats.includes(s));
      }
      // Remove booking from local list too
      local.bookings = (local.bookings || []).filter(b => (b.bookingId !== bId && b.booking_id !== bId));
      await fs.writeFile(path.join(process.cwd(), 'data.json'), JSON.stringify(local, null, 2));
    } catch (e) {}

    // 7. Delete Booking (Supabase)
    if (source === 'sb') {
      await supabase.from('bookings').delete().eq('booking_id', bId);
    }

    return { success: true };
  } catch (err) {
    console.error("Refund Error:", err);
    throw err;
  }
}

export async function getUserBookings(customerPhone) {
  if (!customerPhone) return [];
  const trimmedPhone = customerPhone.trim();
  let allBookings = [];
  
  try {
    // 1. Fetch from Supabase
    const { data: sbData, error: sbError } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_phone', trimmedPhone)
      .order('created_at', { ascending: false });

    if (!sbError && sbData) {
      sbData.forEach(b => {
        allBookings.push({
          bookingId: b.booking_id || b.bookingId,
          customerName: b.customer_name || b.customerName,
          customerPhone: b.customer_phone || b.customerPhone,
          showName: b.show_name || b.showName,
          seats: b.seats,
          totalAmount: b.total_amount || b.totalAmount,
          showDate: b.show_date || b.showDate,
          timestamp: new Date(b.created_at || new Date()).toLocaleString()
        });
      });
    }

    // 2. Fetch from local data.json
    const local = await getLocalData();
    const localBookings = (local.bookings || [])
      .filter(b => (b.customerPhone === trimmedPhone || b.customer_phone === trimmedPhone))
      .map(b => ({
        ...b,
        bookingId: b.bookingId || b.booking_id,
        showDate: b.showDate || b.show_date || b.timestamp?.split(',')[0]
      }));

    // 3. Merge and deduplicate by bookingId
    localBookings.forEach(lb => {
      if (!allBookings.find(sb => sb.bookingId === lb.bookingId)) {
        allBookings.push(lb);
      }
    });

    // 4. Final sort by timestamp/ID (most recent first)
    return allBookings.sort((a, b) => b.bookingId.localeCompare(a.bookingId));
  } catch (err) {
    console.error("Error in getUserBookings:", err);
    return allBookings;
  }
}

export async function getReceipt(bookingId) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .ilike('booking_id', bookingId)
    .single();

  if (error || !data) return null;

  return {
    bookingId: data.booking_id,
    customerName: data.customer_name,
    showName: data.show_name,
    seats: data.seats,
    totalAmount: data.total_amount,
    timestamp: new Date(data.created_at).toLocaleString()
  };
}

export async function getOccupancyReport() {
  try {
    const { data: movies, error } = await supabase
      .from('movies')
      .select('*');

    let movieData = movies;
    if (error) {
      console.error("Supabase Error in getOccupancyReport:", error);
      const local = await getLocalData();
      movieData = local.movies;
    }

    return movieData.map(m => {
      const totalSeats = 50;
      const bookedSeats = (m.booked_seats || m.bookedSeats || []).length;
      const availSeats = totalSeats - bookedSeats;
      const occupancy = ((bookedSeats / totalSeats) * 100).toFixed(1);

      return {
        title: m.title,
        total: totalSeats,
        booked: bookedSeats,
        avail: availSeats,
        occupancy
      };
    });
  } catch (err) {
    console.error("Error in getOccupancyReport:", err);
    return [];
  }
}

