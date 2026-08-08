import React from 'react';
// Import ng iyong Canva background para maging parehas sila ng Home at Bikes Tab!
import mainWebsiteBg from '../assets/BG.png';

const REQUIREMENT_CARDS = (lang) => [
  {
    icon: '🪪',
    title: lang === 'en' ? "Driver's License" : "Lisensya sa Pagmamaneho",
    desc: lang === 'en'
      ? 'Must present 1 Valid Original Driver\'s License upon claiming the motorcycle.'
      : 'Kailangang magpakita ng 1 Valid Original Driver\'s License sa araw ng pagkuha ng motor.'
  },
  {
    icon: '🏛️',
    title: lang === 'en' ? 'Government ID' : 'Gobyerno na ID',
    desc: lang === 'en'
      ? 'Provide 1 additional Valid Government ID (e.g., UMID, SSS, Passport, PRC) for secondary verification.'
      : 'Magdala ng 1 karagdagang Valid Government ID (hal. UMID, SSS, Passport, PRC) para sa pangalawang pagpapatunay.'
  },
  {
    icon: '⛽',
    title: lang === 'en' ? 'Fuel Policy' : 'Patakaran sa Gasolina',
    desc: lang === 'en'
      ? 'Gasoline is NOT included in the rental price. The unit will be handed over with gas, and must be returned with the same level.'
      : 'Ang gasolina ay HINDI kasama sa presyo ng renta. Ibibigay ang motor na may gas, at kailangang ibalik na may parehong rami ng gas.'
  }
];

export default function About({ lang }) {
  return (
    <section
      id="about"
      className="w-full min-h-screen flex flex-col items-center bg-[#0f172a] bg-cover bg-center bg-no-repeat box-border relative p-4 sm:p-8 animate-[fadeInEffect_0.5s_ease-out_forwards]"
      style={{ backgroundImage: `url(${mainWebsiteBg})` }}
    >
      <div className="absolute top-0 left-0 w-full h-[90px] bg-transparent z-10" />

      <div className="glass-panel border-2 max-w-[1280px] w-full p-6 sm:p-14 box-border mt-[120px] mb-16 z-20">

        <div className="text-center mb-12">
          <span className="eyebrow block mb-2">Know Before You Ride</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4 tracking-wide text-balance">
            {lang === 'en' ? 'About ' : 'Tungkol sa '}<span className="text-brand-primary">MotoRent</span>
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-loose max-w-[900px] mx-auto">
            {lang === 'en'
              ? 'We provide reliable, safe, and affordable motorcycle rentals in Norzagaray and nearby towns. All our units are brand new, meticulously maintained, and come with complete documents for your smooth and secure journey.'
              : 'Kami ay nagbibigay ng maaasahan, ligtas, at abot-kayang pag-renta ng mga motorsiklo sa Norzagaray at mga karatig-bayan. Lahat ng aming mga yunit ay bago, alagang-alaga sa maintenance, at may kumpletong papeles para sa iyong smooth at ligtas na biyahe.'}
          </p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-8 w-full">
          {REQUIREMENT_CARDS(lang).map((card) => (
            <div
              key={card.title}
              className="glass-card glass-card-hover p-8 sm:p-10 text-center"
            >
              <div className="text-5xl mb-4">{card.icon}</div>
              <h3 className="font-display text-xl mb-4 text-brand-primary font-bold">
                {card.title}
              </h3>
              <p className="text-[0.95rem] text-brand-muted leading-relaxed m-0">
                {card.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
