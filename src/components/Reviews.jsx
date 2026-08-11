import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import mainWebsiteBg from '../assets/BG.jpg';

export default function Reviews({ lang }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setReviews(data);
    } catch (err) {
      console.error("Error pulling transparency logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const renderStars = (count) => {
    return '⭐'.repeat(count || 5);
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-white">
        <p>⏳ Loading transparency wall...</p>
      </div>
    );
  }

  return (
    <section
      id="reviews"
      className="w-full min-h-[60vh] flex flex-col items-center bg-[#0f172a] bg-cover bg-center bg-no-repeat box-border relative px-4 pb-40 pt-0"
      style={{ backgroundImage: `url(${mainWebsiteBg})` }}
    >
      <div className="glass-panel relative top-[130px] border-2 max-w-[850px] w-full p-6 sm:p-14 box-border z-20 mb-16">

        <div className="text-center mb-10">
          <span className="eyebrow block mb-2">Straight From The Road</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2 tracking-wide text-balance">
            {lang === 'en' ? 'Client ' : 'Mga '}<span className="text-brand-primary">Reviews</span>
          </h2>
          <p className="text-slate-300 text-base m-0">
            {lang === 'en'
              ? 'Read genuine experiences and transparent ride logs submitted by our community drivers.'
              : 'Basahin ang mga tunay na karanasan at transparent ride logs na ipinasa ng ating mga drivers.'}
          </p>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12 text-brand-muted bg-brand-surface/40 rounded-2xl border border-white/5">
            {lang === 'en' ? 'No verified client logs posted yet.' : 'Wala pang naka-post na verified client review.'}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="glass-card glass-card-hover p-6 text-left"
              >
                <div className="flex justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <strong className="text-brand-primary text-[1.05rem] tracking-wide">@{rev.client_name || 'Client'}</strong>
                    <span className="text-xs text-brand-muted ml-3">
                      {new Date(rev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-[0.95rem]">{renderStars(rev.rating)}</div>
                </div>

                <div className="text-xs font-bold text-white inline-block bg-brand-primary/15 border border-brand-primary/30 px-2.5 py-1 rounded-lg mb-3">
                  Unit: {rev.motorcycle_name || 'Motorcycle Unit'}
                </div>

                <p className="text-base text-slate-100 leading-relaxed m-0 italic">
                  "{rev.comment || 'No comment provided.'}"
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
