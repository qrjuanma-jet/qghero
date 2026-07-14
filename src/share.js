export function initShareButtons(songUrl) {
  const shareBtn = document.getElementById('share-btn');
  
  shareBtn.addEventListener('click', async () => {
    const shareData = {
      title: 'QGHERO',
      text: '¡Mira esta canción que estoy aprendiendo a tocar en guitarra con QGHERO!',
      url: window.location.href + (songUrl ? `?v=${encodeURIComponent(songUrl)}` : '')
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`;
      window.open(whatsappUrl, '_blank');
    }
  });
}
