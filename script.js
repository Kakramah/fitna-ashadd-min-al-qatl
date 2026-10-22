(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
