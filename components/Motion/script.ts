// Runs in <head> before paint, after SKIN_SCRIPT. Keep it tiny and dependency-free.
//
// Decides whether the site intro plays (html[data-intro]):
//   "play"  the visit starts on the home page, first time this browser session,
//           the tab is visible, motion is allowed and it isn't a bot or a print
//   "done"  everything else (and what INTRO_SCRIPT sets when the intro ends)
// The intro's own script (SiteIntro) moves "play" on to "leave" and "done".
//
// While it plays, --intro-wait (inline on <html>) holds every data-enter for
// 1.5s, so the page's entrance starts as the paper lifts. It must not change
// while those entrances are waiting or running: a shorter delay would finish
// them at once, under the paper. So it stays through "leave" and "done", is
// set to the time already elapsed on a skip (the entrance plays from then),
// and is removed 2s after the end, when every entrance has finished. A client
// navigation removes it at once (PageTransition): only the first page waits.

export const INTRO_SESSION_KEY = "kk-intro";

export const MOTION_SCRIPT = `(function(){var h=document.documentElement,p="done";try{if(location.pathname==="/"&&!sessionStorage.getItem("${INTRO_SESSION_KEY}")&&document.visibilityState!=="hidden"&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&!matchMedia("print").matches&&!/bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent))p="play";sessionStorage.setItem("${INTRO_SESSION_KEY}","1")}catch(e){}h.dataset.intro=p;if(p==="play")h.style.setProperty("--intro-wait","1.5s")})();`;

/**
 * Runs inline right after the intro's markup (the header is already in the
 * DOM). Aims the mark at the header logo, lifts the paper at 1.25s and ends at
 * 1.95s; any key, click, touch or wheel skips (the page's entrance then plays
 * from that moment). Everything it writes goes on
 * <html> (suppressHydrationWarning), never on React-owned nodes.
 */
export const INTRO_SCRIPT = `(function(){var h=document.documentElement;if(h.dataset.intro!=="play")return;var t=[],ev=["pointerdown","keydown","wheel","touchstart"];function aim(){var m=document.querySelector(".kk-intro-mark"),l=document.querySelector("[data-logo-mark]");if(!m||!l)return;var a=m.getBoundingClientRect(),b=l.getBoundingClientRect();if(!a.width||!b.width)return;h.style.setProperty("--intro-dx",(b.left+b.width/2-a.left-a.width/2).toFixed(1)+"px");h.style.setProperty("--intro-dy",(b.top+b.height/2-a.top-a.height/2).toFixed(1)+"px");h.style.setProperty("--intro-s",(b.width/a.width).toFixed(4))}function end(){t.forEach(clearTimeout);ev.forEach(function(e){removeEventListener(e,skip,true)});h.dataset.intro="done";setTimeout(function(){h.style.removeProperty("--intro-wait")},2000)}function skip(){if(h.dataset.intro!=="play")return;t.forEach(clearTimeout);var n=document.timeline&&document.timeline.currentTime,s0=n;try{document.getAnimations().forEach(function(a){if(a.startTime!=null&&a.startTime<s0)s0=a.startTime})}catch(e){}h.style.setProperty("--intro-wait",Math.max(0,Math.min(1500,Math.round((n||0)-(s0||0))))+"ms");h.dataset.intro="skip";t=[setTimeout(end,260)]}aim();t.push(setTimeout(function(){aim();h.dataset.intro="leave"},1250));t.push(setTimeout(end,1950));ev.forEach(function(e){addEventListener(e,skip,{capture:true,passive:true})})})();`;
