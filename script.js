/* ============================================================
   Valentine's Day Page — Script
   Handles: background hearts, "No" button evasion,
   "Yes" celebration with floating hearts on canvas.
   ============================================================ */

 (function () {
  "use strict";

   // ---- DOM references ----
  var questionView = document.getElementById("question-view");
  var successView  = document.getElementById("success-view");
  var btnYes       = document.getElementById("btn-yes");
  var btnNo        = document.getElementById("btn-no");
  var bgContainer  = document.getElementById("bg-hearts");
  var canvas       = document.getElementById("celebration");
  var ctx          = canvas.getContext("2d");

   // ============================================================
  // 1. Background floating hearts
  // ============================================================

   /** Spawn a single floating heart in the background. */
  function spawnBgHeart() {
    var el = document.createElement("span");
    el.classList.add("bg-heart");
    el.textContent = "\u2665"; // heart character

     // Randomise horizontal position, size, speed, and sway
    var size     = Math.random() * 18 + 12;           // 12-30 px
    var left     = Math.random() * 100;               // 0-100 vw
    var duration = Math.random() * 8 + 8;             // 8-16 s
    var delay    = Math.random() * 4;                  // 0-4 s

     el.style.left            = left + "vw";
    el.style.fontSize        = size + "px";
    el.style.animationDuration = duration + "s";
    el.style.animationDelay  = delay + "s";

     bgContainer.appendChild(el);

     // Remove element after its animation ends to avoid DOM bloat
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, (duration + delay) * 1000 + 500);
  }

   /** Continuously spawn background hearts. */
  function startBgHearts() {
    // Initial batch
    for (var i = 0; i < 12; i++) {
      spawnBgHeart();
    }
    // Ongoing spawn every 1.5 s
    setInterval(spawnBgHeart, 1500);
  }

   startBgHearts();

   // ============================================================
  // 2. "No" button evasion
  // ============================================================

   var noEvadeCount = 0; // Track how many times the button has evaded

   /**
   * Move the "No" button to a random position within the card
   * so it becomes impossible to click.
   */
  function evadeNo() {
    noEvadeCount++;

     // Get the card bounding box so the button stays inside
    var card   = document.getElementById("card");
    var cardR  = card.getBoundingClientRect();
    var btnR   = btnNo.getBoundingClientRect();

     // Available space within the card (with padding)
    var pad    = 16;
    var maxX   = cardR.width  - btnR.width  - pad * 2;
    var maxY   = cardR.height - btnR.height - pad * 2;

     // Random offset from card top-left (inside card padding)
    var newX = Math.random() * maxX + pad;
    var newY = Math.random() * maxY + pad;

     // Switch to absolute positioning inside card
    btnNo.style.position = "absolute";
    btnNo.style.left     = newX + "px";
    btnNo.style.top      = newY + "px";
    btnNo.style.zIndex   = "10";
    btnNo.style.margin   = "0";

     // After a few dodges, shrink the button for comedic effect
    if (noEvadeCount > 3) {
      var scale = Math.max(0.6, 1 - noEvadeCount * 0.06);
      btnNo.style.transform = "scale(" + scale + ")";
    }
  }

   // Evade on hover (desktop) and on touchstart (mobile)
  btnNo.addEventListener("mouseenter", evadeNo);
  btnNo.addEventListener("touchstart", function (e) {
    e.preventDefault();
    evadeNo();
  });
  // Safety: also evade on click in case someone manages to click it
  btnNo.addEventListener("click", function (e) {
    e.preventDefault();
    evadeNo();
  });

   // ============================================================
  // 3. "Yes" button — success + celebration
  // ============================================================

   btnYes.addEventListener("click", function () {
    // Switch views
    questionView.classList.add("hidden");
    successView.classList.remove("hidden");

     // Launch the celebration animation
    startCelebration();
  });

   // ============================================================
  // 4. Celebration animation (canvas-based floating hearts)
  // ============================================================

   var hearts       = [];
  var animating    = false;
  var animFrameId  = null;

   /** Resize canvas to fill the viewport. */
  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

   window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

   /** Create a single celebration heart particle. */
  function createHeart() {
    var colors = [
      "rgba(255, 74, 110, A)",   // pink
      "rgba(255, 120, 150, A)",  // light pink
      "rgba(255, 50, 80, A)",    // red-pink
      "rgba(255, 180, 200, A)",  // soft blush
      "rgba(230, 60, 100, A)"    // deeper rose
    ];
    var color = colors[Math.floor(Math.random() * colors.length)];

     return {
      x:        Math.random() * canvas.width,
      y:        canvas.height + 20,
      size:     Math.random() * 16 + 10,
      speedY:   -(Math.random() * 3 + 1.5),
      speedX:   (Math.random() - 0.5) * 2,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.06,
      opacity:  Math.random() * 0.5 + 0.5,
      color:    color
    };
  }

   /** Draw a heart shape at (0, 0) of given size. */
  function drawHeart(h) {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.rotation);
    ctx.globalAlpha = h.opacity;

     var s = h.size;
    ctx.fillStyle = h.color.replace("A", h.opacity.toString());
    ctx.beginPath();
    // Heart using bezier curves
    ctx.moveTo(0, -s * 0.35);
    ctx.bezierCurveTo(-s * 0.5, -s,  -s,      -s * 0.4, 0, s * 0.4);
    ctx.bezierCurveTo( s,      -s * 0.4,  s * 0.5, -s,      0, -s * 0.35);
    ctx.fill();

     ctx.restore();
  }

   /** Main animation loop for celebration. */
  function animateCelebration() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

     // Update and draw each heart
    for (var i = hearts.length - 1; i >= 0; i--) {
      var h = hearts[i];
      h.y        += h.speedY;
      h.x        += h.speedX;
      h.rotation += h.rotSpeed;

       // Fade out near the top
      if (h.y < canvas.height * 0.15) {
        h.opacity -= 0.015;
      }

       // Remove if invisible or off-screen
      if (h.opacity <= 0 || h.y < -40) {
        hearts.splice(i, 1);
        continue;
      }

       drawHeart(h);
    }

     // Keep spawning for a while
    if (animating) {
      // Spawn a few per frame for density
      for (var j = 0; j < 3; j++) {
        hearts.push(createHeart());
      }
    }

     // Keep loop running while there are hearts
    if (hearts.length > 0 || animating) {
      animFrameId = requestAnimationFrame(animateCelebration);
    }
  }

   /** Kick off the celebration. */
  function startCelebration() {
    animating = true;
    hearts = [];

     // Initial burst
    for (var i = 0; i < 50; i++) {
      var h = createHeart();
      h.y = Math.random() * canvas.height; // spread across screen
      hearts.push(h);
    }

     animateCelebration();

     // Stop spawning new hearts after 5 seconds; existing ones fade out
    setTimeout(function () {
      animating = false;
    }, 5000);
  }

 })();
