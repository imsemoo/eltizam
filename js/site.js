(function () {
  "use strict";

  var root = document.documentElement;
  var header = document.querySelector(".site-header");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header: solid after the top of the page, hides while reading down ---------- */
  var sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:80px;pointer-events:none";
  document.body.prepend(sentinel);

  new IntersectionObserver(function (entries) {
    header.classList.toggle("is-solid", !entries[0].isIntersecting);
  }).observe(sentinel);

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("mobile-menu");

  function setMenu(open) {
    root.classList.toggle("menu-open", open);
    header.classList.remove("is-hidden");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.inert = !open;
    document.body.style.overflow = open ? "hidden" : "";
    if (open) menu.querySelector("a").focus();
  }

  if (toggle && menu) {
    menu.inert = true;
    toggle.addEventListener("click", function () {
      setMenu(!root.classList.contains("menu-open"));
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && root.classList.contains("menu-open")) {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  /* ---------- Contact form: inline validation, then hand off to the mail client ---------- */
  var form = document.querySelector("[data-contact-form]");

  if (form) {
    var status = form.querySelector(".form-status");
    var rules = {
      name: function (value) { return value.length > 1 || "Enter your name."; },
      email: function (value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Enter an email address like name@company.com."; },
      phone: function (value) { return /^[+\d][\d\s()-]{6,}$/.test(value) || "Enter a phone number with at least 7 digits."; },
      city: function (value) { return value.length > 1 || "Enter your city."; },
      message: function (value) { return value.length > 9 || "Tell us a little more (at least 10 characters)."; }
    };

    function check(input) {
      var rule = rules[input.name];
      if (!rule) return true;
      var result = rule(input.value.trim());
      var field = input.closest(".field");
      var error = field.querySelector(".error");
      var valid = result === true;
      field.classList.toggle("is-invalid", !valid);
      input.setAttribute("aria-invalid", String(!valid));
      error.textContent = valid ? "" : result;
      return valid;
    }

    form.addEventListener("focusout", function (event) {
      if (event.target.value) check(event.target);
    });

    form.addEventListener("input", function (event) {
      if (event.target.closest(".is-invalid")) check(event.target);
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var inputs = Array.prototype.slice.call(form.querySelectorAll("input, textarea"));
      var firstInvalid = inputs.filter(function (input) { return !check(input); })[0];
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }
      var data = new FormData(form);
      var body = "Name: " + data.get("name") + "\nPhone: " + data.get("phone") + "\nCity: " + data.get("city") + "\n\n" + data.get("message");
      window.location.href = "mailto:" + form.dataset.to +
        "?subject=" + encodeURIComponent("Enquiry from " + data.get("name")) +
        "&body=" + encodeURIComponent(body);
      status.hidden = false;
      status.textContent = "Your email app should open with the message ready to send. If it doesn't, write to us at " + form.dataset.to + ".";
    });
  }

  /* ---------- Motion ---------- */
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();

  // Headline lines rise out of their masks on load: sets the reading order of the page.
  gsap.from(".line > span", {
    yPercent: 110,
    duration: 1.1,
    ease: "expo.out",
    stagger: 0.09,
    delay: 0.1
  });

  gsap.from("[data-intro]", {
    y: 24,
    autoAlpha: 0,
    duration: 1,
    ease: "expo.out",
    stagger: 0.08,
    delay: 0.45
  });

  // Media wipes open from the bottom, like a page being uncovered.
  gsap.utils.toArray("[data-wipe]").forEach(function (el) {
    gsap.fromTo(el,
      { clipPath: "inset(100% 0% 0% 0%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.4,
        ease: "expo.inOut",
        scrollTrigger: { trigger: el, start: "top 85%", once: true }
      });
    var img = el.querySelector("img");
    if (img) {
      gsap.fromTo(img, { scale: 1.25 }, {
        scale: 1,
        duration: 1.8,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true }
      });
    }
  });

  // Hero calligraphy fills as the visitor scrolls away from it.
  var word = document.querySelector(".hero-word");
  if (word) {
    gsap.from(word, { autoAlpha: 0, xPercent: 6, duration: 2, ease: "expo.out", delay: 0.2 });
    gsap.to(word, {
      "--fill": "100%",
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
  }

  // Statement: each word lights up in reading order as it crosses the viewport.
  gsap.utils.toArray("[data-words]").forEach(function (el) {
    el.querySelectorAll("p").forEach(function (p) {
      p.innerHTML = p.innerHTML.replace(/(<em[^>]*>.*?<\/em>|[^\s<]+)/g, '<span class="word">$1</span>');
    });
    gsap.fromTo(el.querySelectorAll(".word"), { opacity: 0.14 }, {
      opacity: 1,
      stagger: 0.1,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top 75%", end: "bottom 45%", scrub: true }
    });
  });

  // Generic reveal for content blocks.
  gsap.utils.toArray("[data-reveal]").forEach(function (el) {
    var targets = el.hasAttribute("data-stagger") ? el.children : el;
    gsap.from(targets, {
      y: 40,
      autoAlpha: 0,
      duration: 1.1,
      ease: "expo.out",
      stagger: 0.1,
      scrollTrigger: { trigger: el, start: "top 82%", once: true }
    });
  });

  // Full-bleed band: image drifts slower than the page for depth.
  gsap.utils.toArray(".band .duo img").forEach(function (img) {
    gsap.fromTo(img, { yPercent: -8, scale: 1.15 }, {
      yPercent: 8,
      ease: "none",
      scrollTrigger: { trigger: img.closest(".band"), start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  // Services: vertical scroll drives a horizontal walk through the practice areas.
  mm.add("(min-width: 768px)", function () {
    var pan = document.querySelector(".pan");
    if (!pan) return;
    var track = pan.querySelector(".pan-track");
    var distance = function () { return track.scrollWidth - window.innerWidth; };
    gsap.to(track, {
      x: function () { return -distance(); },
      ease: "none",
      scrollTrigger: {
        trigger: pan,
        start: "top top",
        end: function () { return "+=" + distance(); },
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true
      }
    });
  });

  // Header slides away while reading down and returns on the way up.
  ScrollTrigger.create({
    start: 240,
    end: "max",
    onUpdate: function (self) {
      if (root.classList.contains("menu-open")) return;
      header.classList.toggle("is-hidden", self.direction === 1 && !header.contains(document.activeElement));
    },
    onLeaveBack: function () { header.classList.remove("is-hidden"); }
  });

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
