const Log = (...args) => console.log('\n\n🔥', ...args);

Log('call music.youtube.js');

setInterval(() => {
  const advertise = document.querySelector('.ytp-ad-skip-button-container');
  if (advertise) {
    Log('advertise.click()');
    advertise.click();
  }
}, 1000);
