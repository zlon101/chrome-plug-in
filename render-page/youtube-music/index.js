const Log = (...args) => console.log('\n\n🔥', ...args);

setInterval(() => {
  const advertise = document.querySelector('.ytp-ad-skip-button-container');
  if (advertise) {
    Log('advertise.click()');
    advertise.click();
  }
  const ad2 = document.querySelector('.style-scope.yt-button-renderer');
  if (ad2 && ad2.textContent.includes('广告')) {
    Log('$ad2');
    ad2.click();
  }

  const ad3 = document.querySelector('.style-scope.ytmusic-popup-container #button');
  ad3 && ad3.click();
}, 500);
