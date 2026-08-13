// Import ng iyong Canva background para maging parehas sila ng Home at Bikes Tab!
import mainWebsiteBg from '../assets/BG.jpg';

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
  }
];

// Totoong patakaran ng negosyo — hindi ginawa-gawa, direktang galing sa
// business owner. Kung magbabago ang kahit alin dito sa totoong buhay,
// dito lang dapat i-edit.
const POLICY_CARDS = (lang) => [
  {
    icon: '💰',
    title: lang === 'en' ? 'Deposit' : 'Deposit',
    desc: lang === 'en'
      ? 'A 30% deposit of your total rental cost secures your booking. The remaining balance is settled upon pickup.'
      : 'Isang 30% deposit ng kabuuang halaga ng renta ang kailangan para ma-secure ang booking mo. Babayaran ang natitirang balanse sa araw ng pagkuha.'
  },
  {
    icon: '🪖',
    title: lang === 'en' ? 'Helmet' : 'Helmet',
    desc: lang === 'en'
      ? '1 helmet is included with every rental. Riding with a passenger? An extra helmet is available to rent for ₱150.'
      : 'Isang helmet ang kasama sa bawat renta. May kasama ka bang sasakay? Puwede kang mag-rent ng dagdag na helmet sa halagang ₱150.'
  },
  {
    icon: '🕐',
    title: lang === 'en' ? 'Minimum Rental' : 'Pinakamaikling Renta',
    desc: lang === 'en'
      ? 'Our shortest package is Per Hour — book by the hour, half-day, or full day, whichever fits your trip.'
      : 'Ang pinakamaikling package namin ay Per Hour — pumili ka ng oras, kalahating araw, o buong araw, kung alin ang bagay sa iyong biyahe.'
  },
  {
    icon: '🛣️',
    title: lang === 'en' ? 'Mileage' : 'Mileage',
    desc: lang === 'en'
      ? 'No mileage limit — ride as far as your trip takes you.'
      : 'Walang mileage limit — sumakay ka kahit gaano kalayo ang kailangan mo.'
  },
  {
    icon: '⛽',
    title: lang === 'en' ? 'Fuel Policy' : 'Patakaran sa Gasolina',
    desc: lang === 'en'
      ? 'Gasoline is not included in the rental price. The unit is handed over at a certain fuel level and must be returned at that same level.'
      : 'Ang gasolina ay hindi kasama sa presyo ng renta. Ibibigay ang motor na may partikular na dami ng gas, at kailangang ibalik na may parehong dami.'
  },
  {
    icon: '📍',
    title: lang === 'en' ? 'Pickup & Return' : 'Pagkuha at Pagbalik',
    desc: lang === 'en'
      ? 'Units are picked up and returned at our hub in Norzagaray, Bulacan — see the Contact page for the exact address and map.'
      : 'Kinukuha at ibinabalik ang mga unit sa aming hub sa Norzagaray, Bulacan — tingnan ang Contact page para sa eksaktong address at mapa.'
  },
  {
    icon: '🚨',
    title: lang === 'en' ? 'Late Return' : 'Late na Pagbalik',
    desc: lang === 'en'
      ? "Returning late without arranging an extension is charged an hourly late fee at the unit's per-hour rate."
      : 'Kapag late na-return nang walang extension, sisingilin ng hourly late fee base sa per-hour rate ng unit.'
  },
  {
    icon: '❌',
    title: lang === 'en' ? 'Cancellation' : 'Cancellation',
    desc: lang === 'en'
      ? 'The 30% deposit is non-refundable once a booking is cancelled — please choose your unit and schedule carefully before confirming.'
      : 'Hindi na marerefund ang 30% deposit kapag na-cancel na ang booking — pakisiguro munang mabuti ang pili mong unit at schedule bago i-confirm.'
  },
  {
    icon: '🔍',
    title: lang === 'en' ? 'Damage Responsibility' : 'Pananagutan sa Sira',
    desc: lang === 'en'
      ? 'Every unit is inspected before your rental is marked complete. Any damage found is the responsibility of the renter.'
      : 'Ine-inspect ang bawat unit bago tapusin ang renta. Kung may masirang bahagi, pananagutan ito ng umarkila.'
  }
];

export default function About({ lang }) {
  return (
    <section
      id="about"
      className="w-full min-h-[60vh] flex flex-col items-center bg-[#0f172a] bg-cover bg-center bg-no-repeat box-border relative p-4 sm:p-8 animate-[fadeInEffect_0.5s_ease-out_forwards]"
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

        <span className="eyebrow block mb-4">{lang === 'en' ? 'Requirements to Rent' : 'Kailangan Bago Umarkila'}</span>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 w-full mb-14">
          {REQUIREMENT_CARDS(lang).map((card) => (
            <div key={card.title} className="glass-card glass-card-hover p-8 text-center">
              <div className="text-5xl mb-4">{card.icon}</div>
              <h3 className="font-display text-xl mb-3 text-brand-primary font-bold">{card.title}</h3>
              <p className="text-[0.95rem] text-brand-muted leading-relaxed m-0">{card.desc}</p>
            </div>
          ))}
        </div>

        <span className="eyebrow block mb-4">{lang === 'en' ? 'Rental Policies' : 'Mga Patakaran sa Pag-arkila'}</span>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6 w-full">
          {POLICY_CARDS(lang).map((card) => (
            <div key={card.title} className="glass-card p-7 text-left">
              <div className="text-3xl mb-3">{card.icon}</div>
              <h3 className="font-display text-base mb-2 text-brand-primary font-bold">{card.title}</h3>
              <p className="text-[0.88rem] text-brand-muted leading-relaxed m-0">{card.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
