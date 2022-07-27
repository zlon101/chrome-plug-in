const Log = (...args) => console.log('\n\n🔥', ...args);

Log('call music.youtube.js');

setInterval(() => {
  const advertise = document.querySelector('.ytp-ad-skip-button-container');
  if (advertise) {
    Log('advertise.click()');
    advertise.click();
  }
  const ad2 = document.querySelector('.style-scope.yt-button-renderer');
  ad2 && ad2.click();
}, 1000);
