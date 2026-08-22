import bgArtwork from './assets/BG.jpg';

// One navy ground for every page. The scrim is layered as a background image
// over the artwork rather than as an overlay element, so page content sits
// above it naturally and no section needs its own z-index juggling.
//
// Every full-page section imports this, which is what keeps Guidelines,
// Reviews and Contact from reading brighter than the Home and Bikes pages.
export const pageBackground = {
  backgroundImage:
    'linear-gradient(to bottom, rgba(10,15,28,0.88) 0%, rgba(10,15,28,0.94) 60%, rgba(10,15,28,0.97) 100%), ' +
    `url(${bgArtwork})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat'
};
