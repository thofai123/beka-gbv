import { useEffect, useRef, useState } from "react";

const APP_URL = "/beka/";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      if (navRef.current) {
        navRef.current.style.background = window.scrollY > 50
          ? "rgba(255,242,236,0.95)"
          : "rgba(255,242,236,0.7)";
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);

    const targets = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    targets.forEach((el) => io.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      io.disconnect();
    };
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  };

  return (
    <div style={{ background: "linear-gradient(180deg,#fff2ec 0%,#ffe2d3 55%,#ffd0b8 100%)", minHeight: "100vh", fontFamily: "'Poppins',system-ui,sans-serif", color: "#2a0a04", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        body{margin:0;padding:0}
        .bk-nav{position:fixed;top:1.1rem;left:50%;transform:translateX(-50%);z-index:100;display:flex;align-items:center;justify-content:space-between;gap:2rem;padding:.45rem .55rem .45rem 2rem;height:56px;background:rgba(255,242,236,.7);backdrop-filter:blur(22px) saturate(1.5);border:1px solid rgba(192,57,15,.18);border-radius:50px;box-shadow:0 8px 30px rgba(192,57,15,.18);transition:background .3s;width:min(900px,calc(100vw - 2rem))}
        .bk-nav ul{list-style:none;display:flex;gap:2.5rem;margin:0;padding:0}
        .bk-nav ul a{color:#7a4a3e;text-decoration:none;font-size:.85rem;font-weight:500;transition:color .2s;cursor:pointer}
        .bk-nav ul a:hover{color:#2a0a04}
        .bk-navbtn{background:#ff5520;color:#fff;padding:.55rem 1.4rem;border-radius:50px;font-size:.85rem;font-weight:600;cursor:pointer;text-decoration:none;border:none;box-shadow:0 4px 18px rgba(255,85,32,.4);transition:all .2s}
        .bk-navbtn:hover{background:#ff6b38;transform:translateY(-1px)}
        .bk-hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8rem 2rem 5rem;text-align:center;position:relative;overflow:hidden}
        .bk-hero::before{content:'';position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(192,57,15,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(192,57,15,.06) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 80% 70% at 50% 35%,#000 0%,transparent 70%)}
        .bk-eyebrow{position:relative;z-index:1;display:inline-flex;align-items:center;gap:.6rem;font-size:1rem;color:#c0390f;margin-bottom:1.5rem}
        .bk-eyebrow::before,.bk-eyebrow::after{content:'—';opacity:.65}
        .bk-h1{position:relative;z-index:1;font-size:clamp(3rem,9vw,6.5rem);font-weight:700;line-height:1.02;max-width:900px;margin:0 0 1.5rem;color:#2a0a04}
        .bk-h1 em{font-style:normal;background:linear-gradient(90deg,#ff5520 0%,#ffaa44 50%,#ff5520 100%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:sheen 4s ease-in-out infinite}
        @keyframes sheen{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        .bk-sub{position:relative;z-index:1;font-size:clamp(.95rem,2vw,1.15rem);color:#7a4a3e;max-width:560px;margin:0 0 3rem;line-height:1.8;font-weight:300}
        .bk-orb-wrap{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;width:260px;height:260px;margin-bottom:2.5rem}
        .bk-ring{position:absolute;border-radius:50%;border:1px solid rgba(255,85,32,.25);animation:ripple 3.5s ease-out infinite}
        .bk-ring:nth-child(1){width:140px;height:140px;animation-delay:0s}
        .bk-ring:nth-child(2){width:200px;height:200px;animation-delay:.9s}
        .bk-ring:nth-child(3){width:258px;height:258px;animation-delay:1.8s}
        @keyframes ripple{0%{opacity:.8;transform:scale(.88)}100%{opacity:0;transform:scale(1.06)}}
        .bk-orb{position:relative;z-index:2;width:116px;height:116px;border-radius:50%;background:conic-gradient(from 200deg,#ff6b38,#d4450f,#ff5520,#ff8c55,#ff5520,#d4450f);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;box-shadow:0 0 0 5px rgba(255,85,32,.16),0 0 55px rgba(255,85,32,.52);animation:orbpulse 3s ease-in-out infinite}
        @keyframes orbpulse{0%,100%{box-shadow:0 0 0 5px rgba(255,85,32,.16),0 0 55px rgba(255,85,32,.52)}50%{box-shadow:0 0 0 8px rgba(255,85,32,.22),0 0 75px rgba(255,85,32,.68)}}
        .bk-orb-text{font-size:.6rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.95);margin-top:4px}
        .bk-cta{position:relative;z-index:1;display:inline-flex;align-items:center;gap:.6rem;background:#ff5520;color:#fff;padding:.9rem 2.2rem;border-radius:50px;font-size:1rem;font-weight:600;cursor:pointer;border:none;text-decoration:none;box-shadow:0 4px 26px rgba(255,85,32,.48);transition:all .2s;margin-bottom:2.5rem}
        .bk-cta:hover{background:#ff6b38;transform:translateY(-2px)}
        .bk-taglines{position:relative;z-index:1;display:flex;gap:.4rem 1.5rem;flex-wrap:wrap;justify-content:center;max-width:600px}
        .bk-tagline{font-size:.77rem;color:#a8786a}
        .bk-tagline b{color:#f5893a;font-weight:700;margin-right:.3rem;font-size:.69rem}
        .bk-scroll-hint{position:absolute;bottom:2rem;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:.4rem;color:#a8786a;font-size:.67rem;letter-spacing:.14em;text-transform:uppercase;animation:bob 2.8s ease-in-out infinite}
        .bk-scroll-bar{width:1px;height:32px;background:linear-gradient(to bottom,rgba(255,85,32,.6),transparent)}
        @keyframes bob{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(7px)}}
        .bk-hr{border:none;height:1px;background:linear-gradient(to right,transparent,rgba(255,85,32,.2) 35%,rgba(255,85,32,.2) 65%,transparent);margin:0}
        .bk-section{padding:6rem 2rem}
        .bk-section.alt{background:rgba(192,57,15,.05)}
        .bk-wrap{max-width:1100px;margin:0 auto}
        .bk-label{display:inline-flex;align-items:center;gap:.6rem;font-size:.68rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#ff5520;margin-bottom:.9rem}
        .bk-label::before{content:'';display:block;width:20px;height:1.5px;background:#ff5520;border-radius:2px}
        .bk-h2{font-size:clamp(2rem,5vw,3.2rem);font-weight:700;line-height:1.1;color:#2a0a04;margin:0 0 1rem}
        .bk-lead{font-size:1rem;color:#7a4a3e;max-width:480px;line-height:1.85;margin:0}
        .bk-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:3.5rem;position:relative}
        .bk-steps::before{content:'';position:absolute;top:52px;left:12.5%;right:12.5%;height:2px;background:linear-gradient(to right,#ff5520,#f5893a,#3dd68c);z-index:0;border-radius:2px}
        .bk-step{background:transparent;padding:0 1rem 2rem;position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;text-align:center}
        .bk-step-icon{width:106px;height:106px;border-radius:50%;background:#fbe1d4;border:2px solid rgba(192,57,15,.18);display:flex;align-items:center;justify-content:center;margin-bottom:1.4rem;position:relative}
        .bk-step-num{position:absolute;top:-4px;right:-4px;width:26px;height:26px;border-radius:50%;font-size:.68rem;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fbe1d4}
        .bk-step-t{font-size:.95rem;font-weight:600;color:#2a0a04;margin-bottom:.4rem}
        .bk-step-d{font-size:.82rem;color:#7a4a3e;line-height:1.68}
        .bk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.25rem;margin-top:3.5rem}
        .bk-card{background:rgba(192,57,15,.04);border:1px solid rgba(192,57,15,.16);border-radius:20px;padding:1.8rem;display:flex;flex-direction:column;transition:border-color .22s,transform .2s,box-shadow .2s;position:relative;overflow:hidden}
        .bk-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
        .bk-card.cr::before{background:linear-gradient(to right,#ff5520,transparent 70%)}
        .bk-card.cg::before{background:linear-gradient(to right,#3dd68c,transparent 70%)}
        .bk-card.ca::before{background:linear-gradient(to right,#ffaa44,transparent 70%)}
        .bk-card.cb::before{background:linear-gradient(to right,#3b82f6,transparent 70%)}
        .bk-card.cp::before{background:linear-gradient(to right,#a855f7,transparent 70%)}
        .bk-card:hover{transform:translateY(-4px);box-shadow:0 16px 48px rgba(192,57,15,.15)}
        .bk-ibox{width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:1rem}
        .bk-card.cr .bk-ibox{background:rgba(255,85,32,.12);border:1px solid rgba(255,85,32,.2)}
        .bk-card.cg .bk-ibox{background:rgba(61,214,140,.1);border:1px solid rgba(61,214,140,.18)}
        .bk-card.ca .bk-ibox{background:rgba(255,170,68,.1);border:1px solid rgba(255,170,68,.18)}
        .bk-card.cb .bk-ibox{background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.18)}
        .bk-card.cp .bk-ibox{background:rgba(168,85,247,.1);border:1px solid rgba(168,85,247,.18)}
        .bk-card-t{font-size:.97rem;font-weight:600;color:#2a0a04;margin-bottom:.45rem}
        .bk-card-d{font-size:.85rem;color:#7a4a3e;line-height:1.72;flex:1}
        .bk-tag{display:inline-block;margin-top:.9rem;font-size:.65rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;border-radius:50px;padding:.18rem .6rem;border:1px solid}
        .bk-tag.tr{color:#ff5520;background:rgba(255,85,32,.09);border-color:rgba(255,85,32,.2)}
        .bk-tag.tg{color:#3dd68c;background:rgba(61,214,140,.09);border-color:rgba(61,214,140,.2)}
        .bk-tag.ta{color:#ffaa44;background:rgba(255,170,68,.09);border-color:rgba(255,170,68,.2)}
        .bk-tag.tb{color:#3b82f6;background:rgba(59,130,246,.09);border-color:rgba(59,130,246,.2)}
        .bk-tag.tp{color:#a855f7;background:rgba(168,85,247,.09);border-color:rgba(168,85,247,.2)}
        .bk-who-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin-top:3.5rem}
        .bk-who{border-radius:28px;padding:2.2rem 2rem;border:1px solid rgba(192,57,15,.16);display:flex;flex-direction:column;gap:.5rem;position:relative;overflow:hidden;transition:border-color .22s,transform .2s}
        .bk-who:hover{transform:translateY(-4px)}
        .bk-who-art{position:absolute;top:0;right:0;width:150px;height:150px;opacity:.1;pointer-events:none}
        .bk-who.ws{background:linear-gradient(135deg,rgba(255,85,32,.06) 0%,transparent 60%);border-color:rgba(255,85,32,.28)}
        .bk-who.ws:hover{border-color:rgba(255,85,32,.55)}
        .bk-who.wr{background:linear-gradient(135deg,rgba(61,214,140,.06) 0%,transparent 60%);border-color:rgba(61,214,140,.25)}
        .bk-who.wr:hover{border-color:rgba(61,214,140,.5)}
        .bk-who.wa{background:linear-gradient(135deg,rgba(255,170,68,.06) 0%,transparent 60%);border-color:rgba(255,170,68,.25)}
        .bk-who.wa:hover{border-color:rgba(255,170,68,.5)}
        .bk-who-badge{font-size:.65rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding:.24rem .65rem;border-radius:50px;align-self:flex-start;border:1px solid;margin-bottom:.25rem}
        .ws .bk-who-badge{color:#ff5520;background:rgba(255,85,32,.1);border-color:rgba(255,85,32,.22)}
        .wr .bk-who-badge{color:#3dd68c;background:rgba(61,214,140,.1);border-color:rgba(61,214,140,.2)}
        .wa .bk-who-badge{color:#ffaa44;background:rgba(255,170,68,.1);border-color:rgba(255,170,68,.2)}
        .bk-who-title{font-size:1.35rem;font-weight:700;color:#2a0a04}
        .bk-who-desc{font-size:.86rem;color:#7a4a3e;line-height:1.7}
        .bk-who-list{list-style:none;margin:.5rem 0 0;padding:0;display:flex;flex-direction:column;gap:.4rem}
        .bk-who-list li{font-size:.81rem;color:#7a4a3e;padding-left:1.2rem;position:relative;line-height:1.5}
        .bk-who-list li::before{content:'→';position:absolute;left:0;font-size:.7rem;top:1px}
        .ws .bk-who-list li::before{color:#ff5520}
        .wr .bk-who-list li::before{color:#3dd68c}
        .wa .bk-who-list li::before{color:#ffaa44}
        .bk-nums{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;margin-top:3.5rem;text-align:center}
        .bk-num{padding:2.5rem 1.5rem;border-radius:28px;border:1px solid rgba(192,57,15,.16);background:rgba(192,57,15,.04);transition:transform .2s}
        .bk-num:hover{transform:translateY(-3px)}
        .bk-num-big{font-size:3rem;font-weight:900;line-height:1;margin-bottom:.4rem}
        .bk-num-big.nr{color:#ff5520}.bk-num-big.ng{color:#3dd68c}.bk-num-big.na{color:#ffaa44}
        .bk-num-lbl{font-size:.84rem;color:#7a4a3e;line-height:1.6}
        .bk-quote{padding:6rem 2rem;text-align:center;background:radial-gradient(ellipse 70% 55% at 50% 50%,rgba(192,57,15,.1) 0%,transparent 65%)}
        .bk-qinner{max-width:700px;margin:0 auto}
        .bk-qmark{font-size:5.5rem;line-height:.3;color:rgba(255,85,32,.22);display:block;margin-bottom:1.6rem;font-family:Georgia,serif}
        .bk-qrule{width:40px;height:2px;background:#ff5520;border-radius:2px;margin:0 auto 1.3rem}
        .bk-qtext{font-size:clamp(1.2rem,3.5vw,1.85rem);font-weight:700;line-height:1.5;color:#2a0a04;margin-bottom:1.3rem}
        .bk-qattr{font-size:.75rem;color:#a8786a;letter-spacing:.1em;text-transform:uppercase}
        .bk-fcta{padding:7rem 2rem;text-align:center;background:rgba(192,57,15,.05);border-top:1px solid rgba(192,57,15,.16);position:relative;overflow:hidden}
        .bk-fcta::before{content:'';position:absolute;top:-140px;left:50%;transform:translateX(-50%);width:700px;height:500px;pointer-events:none;background:radial-gradient(ellipse,rgba(255,85,32,.15) 0%,transparent 62%)}
        .bk-fcta h2{position:relative;font-size:clamp(1.9rem,5vw,3.2rem);font-weight:700;max-width:600px;margin:0 auto 1rem;color:#2a0a04}
        .bk-fcta p{position:relative;color:#7a4a3e;font-size:1rem;max-width:440px;margin:0 auto 2.5rem;line-height:1.8}
        .bk-badges{position:relative;z-index:1;display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap;margin-bottom:2.5rem}
        .bk-badge{display:inline-flex;align-items:center;gap:.65rem;background:#2a0a04;color:#fff;padding:.7rem 1.3rem;border-radius:14px;text-decoration:none;transition:transform .2s,box-shadow .2s;box-shadow:0 4px 16px rgba(42,10,4,.22)}
        .bk-badge:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(42,10,4,.3)}
        .bk-badge small{display:block;font-size:.6rem;letter-spacing:.05em;opacity:.78;line-height:1.2}
        .bk-badge b{display:block;font-size:.95rem;font-weight:600;line-height:1.15}
        .bk-fsecondary{position:relative;z-index:1;display:inline-flex;align-items:center;gap:.4rem;margin-top:1.6rem;color:#a8786a;font-size:.82rem;text-decoration:none;transition:color .2s}
        .bk-fsecondary:hover{color:#ff5520}
        .bk-footer{background:rgba(192,57,15,.07);border-top:1px solid rgba(192,57,15,.16);padding:3.5rem 2rem 2.5rem}
        .bk-footer-wrap{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr;gap:3rem}
        .bk-flogo{font-size:1.25rem;font-weight:900;letter-spacing:.07em;color:#7a4a3e;margin-bottom:.65rem}
        .bk-flogo span{color:#ff5520}
        .bk-fdesc{font-size:.79rem;color:#a8786a;line-height:1.68;max-width:220px}
        .bk-fproduct{margin-top:1rem;font-size:.75rem;color:#a8786a}
        .bk-fproduct a{color:#ff5520;font-weight:600;text-decoration:none;transition:color .2s}
        .bk-fproduct a:hover{color:#2a0a04}
        .bk-fcol h4{font-size:.67rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#7a4a3e;margin:0 0 1rem}
        .bk-fcol a{display:block;color:#a8786a;text-decoration:none;font-size:.81rem;margin-bottom:.5rem;transition:color .2s;cursor:pointer}
        .bk-fcol a:hover{color:#2a0a04}
        .bk-fbot{max-width:1100px;margin:2.5rem auto 0;border-top:1px solid rgba(192,57,15,.16);padding-top:1.5rem;display:flex;justify-content:space-between;align-items:center;font-size:.75rem;color:#a8786a;flex-wrap:wrap;gap:.5rem}
        .bk-hbg{display:none;width:42px;height:42px;border-radius:50%;border:1px solid rgba(192,57,15,.18);background:rgba(255,255,255,.7);align-items:center;justify-content:center;flex-direction:column;gap:4px;cursor:pointer;padding:0;transition:background .2s;position:fixed;top:1.55rem;z-index:101}
        .bk-hbg span{display:block;width:18px;height:2px;background:#2a0a04;border-radius:2px;transition:transform .25s,opacity .2s}
        .bk-hbg.open span:nth-child(1){transform:translateY(6px) rotate(45deg)}
        .bk-hbg.open span:nth-child(2){opacity:0}
        .bk-hbg.open span:nth-child(3){transform:translateY(-6px) rotate(-45deg)}
        .bk-mmenu{position:fixed;top:5rem;left:50%;transform:translateX(-50%) translateY(-10px);width:calc(100% - 1.5rem);max-width:440px;z-index:99;background:rgba(255,242,236,.97);backdrop-filter:blur(22px);border:1px solid rgba(192,57,15,.18);border-radius:22px;box-shadow:0 14px 40px rgba(192,57,15,.2);padding:1rem;flex-direction:column;gap:.35rem;opacity:0;pointer-events:none;transition:opacity .22s,transform .22s;display:flex}
        .bk-mmenu.open{opacity:1;transform:translateX(-50%) translateY(0);pointer-events:auto}
        .bk-mmenu a{padding:.82rem 1rem;border-radius:14px;font-size:.93rem;font-weight:500;color:#2a0a04;text-decoration:none;cursor:pointer;transition:background .18s}
        .bk-mmenu a:hover{background:rgba(192,57,15,.07)}
        .bk-scrim{position:fixed;inset:0;background:rgba(42,10,4,.3);z-index:98;opacity:0;pointer-events:none;transition:opacity .22s}
        .bk-scrim.open{opacity:1;pointer-events:auto}
        .reveal{opacity:0;transform:translateY(24px);transition:opacity .85s cubic-bezier(.2,.7,.2,1),transform .85s cubic-bezier(.2,.7,.2,1)}
        .reveal.in{opacity:1;transform:translateY(0)}
        @media(max-width:900px){.bk-steps{grid-template-columns:1fr 1fr;gap:1.5rem}.bk-steps::before{display:none}}
        @media(max-width:768px){
          .bk-nav ul,.bk-nav .bk-navbtn{display:none}
          .bk-hbg{display:flex;right:max(1rem,calc(50vw - 210px))}
          .bk-section{padding:4rem 1.1rem}.bk-hero{padding:5rem 1.1rem 3rem}
          .bk-nums{grid-template-columns:1fr;gap:1rem}
          .bk-footer-wrap{grid-template-columns:1fr;gap:2rem}
          .bk-grid,.bk-who-grid{grid-template-columns:1fr;gap:1rem}
          .bk-orb-wrap{width:170px;height:170px;margin-bottom:1.5rem}
          .bk-ring:nth-child(1){width:95px;height:95px}
          .bk-ring:nth-child(2){width:135px;height:135px}
          .bk-ring:nth-child(3){width:170px;height:170px}
          .bk-orb{width:85px;height:85px}
        }
        @media(max-width:500px){.bk-h1{font-size:clamp(2.2rem,11vw,3rem)}.bk-hero{padding:4.5rem 1rem 2.5rem}.bk-h2{font-size:clamp(1.7rem,7vw,2.2rem)}}
      `}</style>

      {/* NAV */}
      <nav className="bk-nav" ref={navRef}>
        <span className="bk-flogo" style={{ cursor: "pointer" }} onClick={() => scrollTo("top")}>BE<span>KA</span></span>
        <ul>
          <li><a onClick={() => scrollTo("how")}>How it works</a></li>
          <li><a onClick={() => scrollTo("features")}>Features</a></li>
          <li><a onClick={() => scrollTo("who")}>Who it's for</a></li>
        </ul>
        <a href={APP_URL} target="_blank" rel="noopener" className="bk-navbtn">Open App ↗</a>
      </nav>

      {/* HERO */}
      <section className="bk-hero" id="top">
        <div className="bk-eyebrow">Safe4All · GBV Emergency Response · Zambia</div>
        <h1 className="bk-h1">When seconds matter,<br /><em>one tap</em> calls for help.</h1>
        <p className="bk-sub">BEKA is a secure, multilingual platform connecting survivors of gender-based violence to responders, shelters, and legal aid — instantly and discreetly.</p>
        <div className="bk-orb-wrap" aria-hidden="true">
          <div className="bk-ring" /><div className="bk-ring" /><div className="bk-ring" />
          <div className="bk-orb">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span className="bk-orb-text">Help Now</span>
          </div>
        </div>
        <a href={APP_URL} target="_blank" rel="noopener" className="bk-cta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Get BEKA Free
        </a>
        <div className="bk-taglines">
          {[["Bemba","Tapali ukwikalafye"],["Nyanja","Simuli nokha"],["Tonga","Tamuli yeka yeka"],["Lozi","Ha mu inzi mwanaa"],["Kaonde","Tamwena bene"]].map(([lang, text]) => (
            <span key={lang} className="bk-tagline"><b>{lang}</b> {text}.</span>
          ))}
        </div>
        <div className="bk-scroll-hint"><div className="bk-scroll-bar" />scroll</div>
      </section>

      <hr className="bk-hr" />

      {/* HOW IT WORKS */}
      <section id="how" className="bk-section alt">
        <div className="bk-wrap">
          <div className="bk-label">How it works</div>
          <h2 className="bk-h2">From alert to assistance<br />in four steps</h2>
          <p className="bk-lead">Offline-resilient and location-aware — designed to work in the moment that matters most.</p>
          <div className="bk-steps">
            {[
              { n:"01", c:"#ff5520", tc:"#fff", t:"Press the panic button", d:"One tap triggers an emergency alert with GPS — even when offline." },
              { n:"02", c:"#3dd68c", tc:"#0a2a1a", t:"Contacts are notified", d:"Your emergency contacts get an SMS with your name and live location link." },
              { n:"03", c:"#3b82f6", tc:"#fff", t:"Responders dispatched", d:"Police, VSU, or shelter units are alerted and head to your location." },
              { n:"04", c:"#ffaa44", tc:"#2a1800", t:"A case file is created", d:"Evidence, updates, and status tracked from alert through to resolution." },
            ].map((s, i) => (
              <div key={i} className="bk-step reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="bk-step-icon">
                  <div className="bk-step-num" style={{ background: s.c, color: s.tc }}>{s.n}</div>
                  <svg viewBox="0 0 80 80" width="60" height="60"><circle cx="40" cy="40" r="38" fill="rgba(192,57,15,.08)"/><circle cx="40" cy="40" r="22" fill={s.c} opacity=".9"/></svg>
                </div>
                <div className="bk-step-t">{s.t}</div>
                <div className="bk-step-d">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="bk-hr" />

      {/* FEATURES */}
      <section id="features" className="bk-section">
        <div className="bk-wrap">
          <div className="bk-label">Features</div>
          <h2 className="bk-h2">Everything built into<br />one secure platform</h2>
          <div className="bk-grid">
            {[
              { c:"cr", tag:"tr", tagLabel:"Core safety", t:"Panic button", d:"One tap sends your location and triggers alerts. Supports silent mode. Works offline with auto-retry." },
              { c:"cr", tag:"tr", tagLabel:"Safety", t:"Live location sharing", d:"Share a real-time location link with trusted contacts. Responders track your movement on the live map." },
              { c:"ca", tag:"ta", tagLabel:"Reporting", t:"Incident reporting", d:"A guided three-step form captures incident type, location, and evidence. Anonymous reporting available." },
              { c:"cg", tag:"tg", tagLabel:"Legal", t:"Evidence vault", d:"Securely upload photos, audio, documents, and ZP Form 32s. Every upload is time-stamped and tamper-evident." },
              { c:"cg", tag:"tg", tagLabel:"Legal", t:"Statement builder", d:"Build a structured incident statement step by step. Export as a PDF with police reference numbers." },
              { c:"cb", tag:"tb", tagLabel:"Coordination", t:"Response unit directory", d:"Police, hospitals, shelters, NGOs, VSUs, OSCs, and legal aid across all 10 Zambian provinces." },
              { c:"cb", tag:"tb", tagLabel:"Communication", t:"Secure messaging", d:"Case-level messaging between survivors, responders, and staff. WhatsApp webhook integration included." },
              { c:"cr", tag:"tr", tagLabel:"Safety", t:"Emergency contacts", d:"Save up to five priority contacts. Each receives an SMS the moment a panic alert is triggered." },
              { c:"cp", tag:"tp", tagLabel:"Admin", t:"Admin dashboard", d:"Live alerts map, escalation monitoring, audit logs, and AI-generated case summaries in one dashboard." },
            ].map((card, i) => (
              <div key={i} className={`bk-card ${card.c} reveal`} style={{ transitionDelay: `${(i % 3) * 0.08}s` }}>
                <div className="bk-ibox">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"><circle cx="12" cy="12" r="5"/></svg>
                </div>
                <div className="bk-card-t">{card.t}</div>
                <div className="bk-card-d">{card.d}</div>
                <span className={`bk-tag ${card.tag}`}>{card.tagLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="bk-hr" />

      {/* WHO IT'S FOR */}
      <section id="who" className="bk-section alt">
        <div className="bk-wrap">
          <div className="bk-label">Who it's for</div>
          <h2 className="bk-h2">One platform.<br />Three roles.</h2>
          <div className="bk-who-grid">
            {[
              { cls:"ws", badge:"Survivor", title:"You are not alone.", desc:"BEKA puts safety in your hands — discreet, offline-ready, and available in your own language.", items:["Panic button with silent mode","Live location to trusted contacts","Anonymous incident reporting","Evidence vault & statement builder","Find shelters, NGOs, VSUs & legal aid"], artColor:"rgba(255,85,32,1)" },
              { cls:"wr", badge:"Responder", title:"Reach them faster.", desc:"Real-time alerts and precise location data so every response is faster and better-informed.", items:["Instant SMS panic alert notifications","Live map with survivor coordinates","Case acknowledgement & updates","Secure staff channel messaging","Dispatch coordination across units"], artColor:"rgba(61,214,140,1)" },
              { cls:"wa", badge:"Administrator", title:"Oversight at every level.", desc:"Complete visibility into the response system — from triggered alerts through to resolved cases.", items:["Live alerts map & command dashboard","Response unit management","Critical escalation monitoring","Full accountability & audit logs","Analytics & AI case summaries"], artColor:"rgba(255,170,68,1)" },
            ].map((w, i) => (
              <div key={i} className={`bk-who ${w.cls} reveal`} style={{ transitionDelay: `${i * 0.1}s` }}>
                <svg className="bk-who-art" viewBox="0 0 160 160" aria-hidden="true"><circle cx="130" cy="30" r="80" fill={w.artColor}/><circle cx="80" cy="80" r="40" fill={w.artColor} opacity=".5"/></svg>
                <div className="bk-who-badge">{w.badge}</div>
                <div className="bk-who-title">{w.title}</div>
                <div className="bk-who-desc">{w.desc}</div>
                <ul className="bk-who-list">{w.items.map((item, j) => <li key={j}>{item}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="bk-hr" />

      {/* NUMBERS */}
      <section className="bk-section">
        <div className="bk-wrap" style={{ textAlign: "center" }}>
          <div className="bk-label" style={{ justifyContent: "center" }}>Our reach</div>
          <h2 className="bk-h2">Built for Zambia.<br />Ready for every province.</h2>
          <div className="bk-nums">
            {[
              { big:"10", cls:"nr", label:"Provinces covered across the Republic of Zambia" },
              { big:"5+", cls:"ng", label:"Local languages — Bemba, Nyanja, Tonga, Lozi, Kaonde" },
              { big:"6",  cls:"na", label:"Access channels — App, Web, SMS, WhatsApp, USSD, Offline" },
            ].map((n, i) => (
              <div key={i} className="bk-num reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className={`bk-num-big ${n.cls}`}>{n.big}</div>
                <div className="bk-num-lbl">{n.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="bk-hr" />

      {/* QUOTE */}
      <div className="bk-quote">
        <div className="bk-qinner reveal">
          <span className="bk-qmark">"</span>
          <div className="bk-qrule" />
          <div className="bk-qtext">No survivor should face a moment of danger without a path to safety. BEKA closes that gap — one alert at a time.</div>
          <div className="bk-qattr">Safe4All · Gender-Based Violence Response · Republic of Zambia</div>
        </div>
      </div>

      <hr className="bk-hr" />

      {/* FINAL CTA */}
      <section className="bk-fcta">
        <div className="bk-label" style={{ justifyContent: "center" }}>Get started</div>
        <h2>Ready to make your<br />community safer?</h2>
        <p>BEKA is free to access for survivors, responders, NGOs, shelters, and government agencies across Zambia.</p>
        <div className="bk-badges">
          <a href={APP_URL} target="_blank" rel="noopener" className="bk-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M16.36 1.43c.08 1-.32 1.98-.95 2.69-.66.74-1.74 1.31-2.8 1.23-.1-.98.36-2 .96-2.65.67-.74 1.84-1.29 2.79-1.27zM19.7 16.3c-.5 1.16-.74 1.67-1.39 2.7-.9 1.43-2.18 3.22-3.76 3.23-1.4.01-1.76-.91-3.66-.9-1.9.01-2.29.92-3.69.91-1.58-.01-2.79-1.62-3.7-3.06-2.53-4.01-2.79-8.71-1.23-11.2 1.11-1.77 2.86-2.8 4.5-2.8 1.67 0 2.72.92 4.1.92 1.34 0 2.16-.92 4.1-.92 1.47 0 3.02.8 4.13 2.18-3.63 1.99-3.04 7.17.2 8.84z"/></svg>
            <span><small>Download on the</small><b>App Store</b></span>
          </a>
          <a href={APP_URL} target="_blank" rel="noopener" className="bk-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 1.8c-.36.38-.57.97-.57 1.73v17c0 .76.21 1.35.57 1.73l.1.08L13.2 12.1v-.2L3.7 1.72l-.1.08z" fill="#34A853"/><path d="M16.5 15.3l-3.3-3.2v-.2l3.3-3.2.07.04 3.9 2.2c1.12.63 1.12 1.66 0 2.3l-3.9 2.2-.07.06z" fill="#FBBC05"/><path d="M16.57 15.26L13.2 11.9 3.6 21.5c.37.4.98.45 1.67.06l11.3-6.3z" fill="#EA4335"/><path d="M16.57 8.74L5.27 2.44c-.69-.39-1.3-.34-1.67.06l9.6 9.5 3.37-3.26z" fill="#4285F4"/></svg>
            <span><small>GET IT ON</small><b>Google Play</b></span>
          </a>
        </div>
        <a href={APP_URL} target="_blank" rel="noopener" className="bk-cta" style={{ position: "relative" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Get BEKA Free
        </a>
        <div>
          <a href={APP_URL} className="bk-fsecondary">
            Open BEKA
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bk-footer">
        <div className="bk-footer-wrap">
          <div>
            <div className="bk-flogo">BE<span>KA</span></div>
            <div className="bk-fdesc">A Safe4All initiative for gender-based violence emergency response across the Republic of Zambia.</div>
            <div className="bk-fproduct">
              A product of{" "}
              <a href="https://zcsi-foundation.org" target="_blank" rel="noopener noreferrer">Zambian Cyber Security Initiative Foundation</a>
            </div>
          </div>
          <div className="bk-fcol">
            <h4>Platform</h4>
            <a onClick={() => scrollTo("how")}>How it works</a>
            <a onClick={() => scrollTo("features")}>Features</a>
            <a onClick={() => scrollTo("who")}>Who it's for</a>
            <a href={APP_URL} target="_blank" rel="noopener">Open App ↗</a>
          </div>
          <div className="bk-fcol">
            <h4>Access</h4>
            <a href={APP_URL} target="_blank" rel="noopener">Open BEKA</a>
            <a href="mailto:support@safe4all.zm">Contact</a>
          </div>
        </div>
        <div className="bk-fbot">
          <span>© 2026 Safe4All · BEKA GBV Emergency Response</span>
          <span>Built for survivors, responders &amp; communities across Zambia</span>
        </div>
      </footer>

      {/* MOBILE HAMBURGER */}
      <button className={`bk-hbg${menuOpen ? " open" : ""}`} aria-label="Toggle menu" type="button" onClick={() => setMenuOpen(v => !v)}>
        <span /><span /><span />
      </button>
      <div className={`bk-mmenu${menuOpen ? " open" : ""}`}>
        <a onClick={() => scrollTo("how")}>How it works</a>
        <a onClick={() => scrollTo("features")}>Features</a>
        <a onClick={() => scrollTo("who")}>Who it's for</a>
        <a href={APP_URL} target="_blank" rel="noopener" className="bk-navbtn" onClick={() => setMenuOpen(false)}>Open App ↗</a>
      </div>
      <div className={`bk-scrim${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(false)} />
    </div>
  );
}