import React from 'react';

export default function Hero({ setActiveTab, lang }) {
  return (
    <section id="home">
      <div className="hero">
        <h1>
          {lang === 'en' ? 'Rent a Motorcycle the Easy Way' : 'Mag-rent ng Motor sa Madaling Paraan'}
        </h1>
        <p>
          {lang === 'en' 
            ? 'Affordable rentals for your daily commute, work, or road trips.' 
            : 'Abot-kayang renta para sa iyong pang-araw-araw na biyahe, trabaho, o gala.'}
        </p>
        <a 
          href="#" 
          className="btn"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('bikes');
          }}
        >
          {lang === 'en' ? 'View Our Bikes' : 'Tumingin ng Motor'}
        </a>
      </div>
    </section>
  );
}