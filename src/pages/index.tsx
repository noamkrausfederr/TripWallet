import Link from 'next/link';
import Image from 'next/image';

const benefits = [
  {
    title: 'ALL YOUR TRAVEL',
    copy: 'Keep all your trips, bookings, and tickets in one place',
  },
  {
    title: 'STAY ORGANIZED',
    copy: 'See your plans in a clear timeline and never miss a thing',
  },
  {
    title: 'ACCESS ANYTIME',
    copy: 'Your plans, details, and documents — always with you',
  },
];

export default function Home() {
  return (
    <main className="landing-page">
      <section className="landing-shell" aria-label="Trip Wallet introduction">
        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#about">ABOUT US</a>
          <a href="#how-it-works">HOW IT WORKS</a>
          <a href="#pricing">PRICING</a>
          <a className="nav-contact" href="mailto:hello@tripwallet.example">CONTACT US</a>
        </nav>

        <section className="landing-hero" id="about">
          <div className="brand-lockup" aria-label="trip wallet">
            <span className="brand-trip">trip</span>
            <span className="brand-wallet">wallet</span>
          </div>

          <div className="hero-photo-wrap">
            <Image src="/cyclists-hero.png" alt="Cyclists gathered outside a cafe before a ride" className="hero-photo" width={1122} height={1402} priority />
          </div>

          <div className="benefit-list" id="how-it-works">
            {benefits.map((benefit) => (
              <article className="benefit" key={benefit.title}>
                <h2>{`// ${benefit.title}`}</h2>
                <p>{benefit.copy}</p>
              </article>
            ))}
          </div>

          <Image className="bike-sketch" src="/bicycle-sketch-transparent.png" alt="" aria-hidden="true" width={1402} height={1122} />

          <section className="signin-card" id="pricing">
            <h1>YOUR TRIPS.<br />ALL IN ONE PLACE.<br />READY TO GO?</h1>
            <Link href="/auth" className="landing-signin">sign in</Link>
          </section>
        </section>

        <footer className="landing-footer">
          <span>Trip Wallet</span>
          <a href="mailto:hello@tripwallet.example">CONTACT US</a>
        </footer>
      </section>
    </main>
  );
}
