(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fog = document.querySelector('.hero-fog');
  if (fog && !reduced) {
    const ctx = fog.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const color = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    let width = 0;
    let height = 0;
    const paint = () => {
      const bounds = fog.getBoundingClientRect();
      width = fog.width = Math.max(1, Math.round(bounds.width * dpr));
      height = fog.height = Math.max(1, Math.round(bounds.height * dpr));
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color('--smoke-fill');
      ctx.fillRect(0, 0, width, height);
      for (let index = 0; index < 18; index += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = (.12 + Math.random() * .18) * Math.max(width, height);
        const cloud = ctx.createRadialGradient(x, y, 0, x, y, radius);
        cloud.addColorStop(0, color('--smoke-cloud'));
        cloud.addColorStop(1, color('--smoke-clear'));
        ctx.fillStyle = cloud;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
    };
    const wipe = (x, y, radius = 56) => {
      ctx.globalCompositeOperation = 'destination-out';
      const size = radius * dpr;
      const brush = ctx.createRadialGradient(x, y, 0, x, y, size);
      brush.addColorStop(0, color('--smoke-erase'));
      brush.addColorStop(.65, color('--smoke-erase-soft'));
      brush.addColorStop(1, color('--smoke-clear'));
      ctx.fillStyle = brush;
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
    };
    const stroke = (from, to, radius) => {
      const steps = Math.max(1, Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / (radius * dpr * .35)));
      for (let step = 0; step <= steps; step += 1) {
        wipe(from[0] + (to[0] - from[0]) * step / steps, from[1] + (to[1] - from[1]) * step / steps, radius);
      }
    };
    const point = (event) => {
      const bounds = fog.getBoundingClientRect();
      return [(event.clientX - bounds.left) * dpr, (event.clientY - bounds.top) * dpr];
    };
    paint();
    window.addEventListener('resize', paint, { passive: true });
    let pressed = false;
    let previous = null;
    fog.addEventListener('pointerdown', (event) => { pressed = true; previous = point(event); wipe(...previous); });
    fog.addEventListener('pointermove', (event) => {
      if (!pressed && event.pointerType !== 'mouse') return;
      const current = point(event);
      if (previous) stroke(previous, current, 48);
      previous = current;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((name) => fog.addEventListener(name, () => { pressed = false; previous = null; }));
  }
  const progress = document.getElementById('readingProgress');
  if (!reduced && progress) {
    let pending = false;
    const draw = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const amount = Math.min(1, Math.max(0, window.scrollY / max));
      progress.style.transform = `scaleX(${amount})`;
      pending = false;
    };
    window.addEventListener('scroll', () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(draw);
    }, { passive: true });
    window.addEventListener('resize', draw);
    draw();
  }
  if (!reduced && 'IntersectionObserver' in window) {
    document.body.classList.add('motion-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -20px 0px' });
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
  }
  const stage = document.getElementById('decisionStage');
  const button = document.getElementById('holdButton');
  const result = document.getElementById('holdResult');
  if (stage && button && result) {
    button.addEventListener('click', () => {
      stage.classList.add('is-held');
      button.textContent = 'توقّفت الرواية هنا';
      button.disabled = true;
      result.textContent = 'ابحث عن المصدر، ثم احكم على الفعل وصاحبه.';
    });
  }
  const shareUrl = 'https://kakramah.github.io/fitna-ashadd-min-al-qatl/';
  const shareTitle = 'الفتنة أشد من القتل';
  const shareText = 'رسالة إلى السوريين: حين تصلك كلمة تشعل الخوف، لا تكن طريقها إلى بيت آخر.';
  const shareLinks = {
    shareWhatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareTitle} — ${shareText} ${shareUrl}`)}`,
    shareTelegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    shareX: `https://x.com/intent/post?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    shareFacebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
  };
  Object.entries(shareLinks).forEach(([id, href]) => {
    const link = document.getElementById(id);
    if (link) link.href = href;
  });
  const shareStatus = document.getElementById('shareStatus');
  const native = document.getElementById('shareNative');
  if (native && navigator.share) {
    native.hidden = false;
    native.addEventListener('click', async () => {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } catch (error) {
        if (error.name !== 'AbortError' && shareStatus) shareStatus.textContent = 'تعذرت المشاركة من الجهاز. يمكنك نسخ الرابط.';
      }
    });
  }
  const copy = document.getElementById('shareCopy');
  if (copy) copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      if (shareStatus) shareStatus.textContent = 'نُسخ رابط الرسالة.';
    } catch {
      if (shareStatus) shareStatus.textContent = 'تعذر النسخ. افتح الرابط من شريط العنوان.';
    }
  });
})();
